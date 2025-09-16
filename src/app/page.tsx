'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, getDay } from 'date-fns';
import { AppHeader } from "@/components/header";
import { CalendarView } from "@/components/calendar-view";
import { ConfirmedAppointments } from "@/components/confirmed-appointments";
import { PendingAppointments } from "@/components/pending-appointments";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus } from 'lucide-react';
import { Service, Funcionario, Appointment, PendingAppointment, Block, WorkSchedule, StaffQueue } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { db, seedDatabase } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { 
    services, 
    funcionarios, 
    confirmedAppointments, 
    pendingAppointments,
    blocks,
    workSchedules,
    appSettings,
    staffQueue,
    loading: dataLoading 
  } = useData();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [clientName, setClientName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState<'confirmed' | 'pending'>('pending');
  const [conflictError, setConflictError] = useState('');
  const { toast } = useToast();
  
  useEffect(() => {
    // Seed the database if necessary
    seedDatabase();
  }, []);

  const selectedService = useMemo(() => {
      return services.find(s => s.id === selectedServiceId)
    }, [services, selectedServiceId]);

  const filteredStaff = useMemo(() => {
    if (!selectedService) {
      return [];
    }
    return funcionarios.filter(s => s.roleId === selectedService.roleId);
  }, [funcionarios, selectedService]);

  const staffOptions = useMemo(() => {
    return filteredStaff.map(s => ({ value: s.id, label: s.name }));
  }, [filteredStaff]);

  const serviceOptions = useMemo(() => {
    return services.map(s => ({ value: s.id, label: `${s.name} - R$${s.price}` }));
  }, [services]);

  const resetForm = () => {
    setClientName('');
    setSelectedServiceId('');
    setSelectedStaffId('');
    setAppointmentDate(format(selectedDate || new Date(), 'yyyy-MM-dd'));
    setAppointmentTime('');
    setAppointmentStatus('pending');
    setConflictError('');
  };

  const isTimeBlocked = (staffId: string, date: string, time: string, serviceDuration: number): string | false => {
    const newAppointmentStart = new Date(`${date}T${time}`).getTime();
    const newAppointmentEnd = newAppointmentStart + serviceDuration * 60 * 1000;

    // Check for conflicts with existing confirmed appointments
    const conflictAppointment = confirmedAppointments.some(existing => {
        if (existing.staffId !== staffId || existing.date !== date) return false;
        const existingService = services.find(s => s.id === existing.serviceId);
        if (!existingService) return false;
        const existingStart = new Date(`${existing.date}T${existing.time}`).getTime();
        const existingEnd = existingStart + existingService.duration * 60 * 1000;
        return newAppointmentStart < existingEnd && newAppointmentEnd > existingStart;
    });
    if (conflictAppointment) return 'Este profissional já possui um agendamento conflitante neste horário.';

    // Check for conflicts with blocks
    const conflictBlock = blocks.some(block => {
        if (block.staffId !== staffId || block.date !== date) return false;
        const blockStart = new Date(`${block.date}T${block.startTime}`).getTime();
        const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime();
        return newAppointmentStart < blockEnd && newAppointmentEnd > blockStart;
    });
    if (conflictBlock) return 'O profissional tem um bloqueio de tempo neste horário.';
    
    // Check against work schedule
    const schedule = workSchedules.find(ws => ws.staffId === staffId);
    if (schedule) {
        const dayIndex = getDay(new Date(date)); // Sunday = 0, Monday = 1, etc.
        const dayOfWeek = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dayIndex];
        const workHours = schedule.horarios[dayOfWeek as keyof typeof schedule.horarios];

        if (!workHours || !workHours.start || !workHours.end) {
            return `O profissional não trabalha neste dia (${dayLabels[dayOfWeek]}).`;
        }

        const workStart = new Date(`${date}T${workHours.start}`).getTime();
        const workEnd = new Date(`${date}T${workHours.end}`).getTime();

        if (newAppointmentStart < workStart || newAppointmentEnd > workEnd) {
            return `O horário do agendamento está fora do expediente do profissional (${workHours.start} - ${workHours.end}).`;
        }
    }


    return false;
  };
  const dayLabels: { [key: string]: string } = {
      segunda: 'Segunda',
      terca: 'Terça',
      quarta: 'Quarta',
      quinta: 'Quinta',
      sexta: 'Sexta',
      sabado: 'Sábado',
      domingo: 'Domingo',
    };

  const updateStaffSales = async (staffId: string, serviceId: string, operation: 'add' | 'subtract') => {
    const service = services.find(s => s.id === serviceId);
    const func = funcionarios.find(f => f.id === staffId);
    if (!service || !func) return;

    const newSalesValue = operation === 'add' 
        ? func.salesValue + service.price 
        : func.salesValue - service.price;
    
    const newSalesGoal = func.salesTarget > 0 
        ? Math.round((newSalesValue / func.salesTarget) * 100)
        : 0;

    const updatedFunc = { ...func, salesValue: newSalesValue, salesGoal: newSalesGoal };
    
    const funcDocRef = doc(db, 'funcionarios', staffId);
    await setDoc(funcDocRef, updatedFunc, { merge: true });
  };
  
    const findAvailableStaffAndAssign = async (service: Service, date: string, time: string): Promise<boolean> => {
        const qualifiedStaff = funcionarios.filter(f => f.roleId === service.roleId);
            
        if (qualifiedStaff.length === 0) {
            setConflictError("Não há funcionários qualificados para este serviço.");
            return false;
        }

        const globalQueue = staffQueue ? staffQueue.staffIds : [];

        // Correctly order staff: those in the queue first, respecting queue order, then those not in the queue.
        const staffInQueue = globalQueue
          .map(staffId => qualifiedStaff.find(s => s.id === staffId))
          .filter((s): s is Funcionario => s !== undefined);
          
        const staffNotInQueue = qualifiedStaff.filter(s => !globalQueue.includes(s.id));

        const potentialStaff = [...staffInQueue, ...staffNotInQueue];

        if (potentialStaff.length === 0) {
            setConflictError("Não há funcionários disponíveis para atribuição.");
            return false;
        }

        let assignedStaffId: string | null = null;
        
        for(const staff of potentialStaff) {
            if(!isTimeBlocked(staff.id, date, time, service.duration)){
                assignedStaffId = staff.id;
                break;
            }
        }
        
        if (assignedStaffId) {
            const newId = `c${(confirmedAppointments?.length || 0) + Date.now()}`;
            const newConfirmedAppointment: Appointment = {
                id: newId,
                date: date,
                client: clientName,
                time: time,
                serviceId: service.id,
                staffId: assignedStaffId,
            };
            await setDoc(doc(db, 'confirmedAppointments', newId), newConfirmedAppointment);
            await updateStaffSales(assignedStaffId, service.id, 'add');

            // Update queue: move the assigned staff to the end
            const newQueue = globalQueue.filter(id => id !== assignedStaffId);
            newQueue.push(assignedStaffId);

            const queueRef = doc(db, 'appState', 'staffQueue');
            await setDoc(queueRef, { staffIds: newQueue }, { merge: true });
            
            const assignedStaffMember = funcionarios.find(f => f.id === assignedStaffId);
            toast({
                title: "Agendamento Automático!",
                description: `Agendamento confirmado com ${assignedStaffMember?.name}.`,
            });
            
            return true;
        } else {
            setConflictError("Nenhum profissional qualificado está disponível neste horário. O agendamento foi adicionado como pendente.");
            // If no one is available, create a pending appointment as a fallback
            const newId = `p${(pendingAppointments?.length || 0) + Date.now()}`;
            const newPendingAppointment: PendingAppointment = {
                id: newId,
                date: appointmentDate,
                client: clientName,
                time: appointmentTime,
                serviceId: selectedServiceId,
            };
            await setDoc(doc(db, 'pendingAppointments', newId), newPendingAppointment);
            return true;
        }
    };


  const handleCreateAppointment = async () => {
    if (!clientName || !appointmentTime || !selectedServiceId || !appointmentDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setConflictError('');

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) {
      alert('Serviço não encontrado.');
      return;
    }

    // Manual Selection Mode
    if (appSettings?.manualSelection) {
        if(appointmentStatus === 'pending') {
            const newId = `p${(pendingAppointments?.length || 0) + Date.now()}`;
            const newPendingAppointment: PendingAppointment = {
                id: newId,
                date: appointmentDate,
                client: clientName,
                time: appointmentTime,
                serviceId: selectedServiceId,
            };
            await setDoc(doc(db, 'pendingAppointments', newId), newPendingAppointment);
        } else { // confirmed
            if (!selectedStaffId) {
                setConflictError('Por favor, selecione um profissional para confirmar o agendamento.');
                return;
            }
            const blockReason = isTimeBlocked(selectedStaffId, appointmentDate, appointmentTime, service.duration);
            if (blockReason) {
                setConflictError(blockReason);
                return;
            }
            const newId = `c${(confirmedAppointments?.length || 0) + Date.now()}`;
            const newConfirmedAppointment: Appointment = {
                id: newId,
                date: appointmentDate,
                client: clientName,
                time: appointmentTime,
                serviceId: selectedServiceId,
                staffId: selectedStaffId,
            };
            await setDoc(doc(db, 'confirmedAppointments', newId), newConfirmedAppointment);
            await updateStaffSales(selectedStaffId, selectedServiceId, 'add');
        }
    } 
    // Automatic Assignment Mode
    else {
        const success = await findAvailableStaffAndAssign(service, appointmentDate, appointmentTime);
        if (success) {
            resetForm();
            document.getElementById('close-dialog-button')?.click();
        }
        return; // findAvailableStaffAndAssign handles its own closing/resetting
    }

    resetForm();
    document.getElementById('close-dialog-button')?.click();
  };
  
  useEffect(() => {
    if (appSettings?.manualSelection) {
        setAppointmentStatus('pending');
    } else {
        setAppointmentStatus('confirmed');
    }
  }, [appSettings]);

  useEffect(() => {
    if (selectedService && filteredStaff && !filteredStaff.find(s => s.id === selectedStaffId)) {
      setSelectedStaffId('');
    }
  }, [selectedService, filteredStaff, selectedStaffId]);

  useEffect(() => {
    if(selectedDate) {
      setAppointmentDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);


  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-background">
      <AppHeader />
      <main className="flex flex-col lg:flex-row flex-1 p-6 lg:p-10 gap-8">
        <div className="flex-1 lg:w-[65%] xl:w-[70%]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold font-headline">Agendamentos</h2>
             <Dialog onOpenChange={(isOpen) => { if (!isOpen) resetForm() }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="client-name" className="text-right">
                      Cliente
                    </Label>
                    <Input id="client-name" value={clientName} onChange={e => setClientName(e.target.value)} className="col-span-3" placeholder="Nome do cliente" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="appointment-date" className="text-right">
                      Data
                    </Label>
                    <Input id="appointment-date" type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="appointment-time" className="text-right">
                      Horário
                    </Label>
                    <Input id="appointment-time" type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="service" className="text-right">
                          Serviço
                        </Label>
                        <div className='col-span-3'>
                          <Combobox
                              options={serviceOptions}
                              value={selectedServiceId}
                              onChange={setSelectedServiceId}
                              placeholder="Selecione um serviço"
                              searchPlaceholder="Buscar serviço..."
                              emptyText="Nenhum serviço encontrado."
                            />
                        </div>
                      </div>
                  
                  {appSettings?.manualSelection && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                          Status
                        </Label>
                        <RadioGroup value={appointmentStatus} className="col-span-3 flex gap-4" onValueChange={(value: 'confirmed' | 'pending') => setAppointmentStatus(value)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pending" id="status-pending" />
                            <Label htmlFor="status-pending">Pendente</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="confirmed" id="status-confirmed" />
                            <Label htmlFor="status-confirmed">Confirmado</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {appointmentStatus === 'confirmed' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff" className="text-right">
                            Profissional
                          </Label>
                          <div className='col-span-3'>
                            <Combobox
                              options={staffOptions}
                              value={selectedStaffId}
                              onChange={setSelectedStaffId}
                              placeholder="Selecione um profissional"
                              searchPlaceholder="Buscar profissional..."
                              emptyText="Nenhum profissional qualificado."
                              />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!appSettings?.manualSelection && (
                     <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="staff" className="text-right">
                            Profissional
                          </Label>
                          <div className='col-span-3'>
                            <Input id="staff" disabled value="Atribuído automaticamente" />
                          </div>
                        </div>
                  )}

                   {conflictError && (
                    <div className="col-span-4 text-sm text-red-500 text-center p-2 bg-red-500/10 rounded-md">
                      {conflictError}
                    </div>
                  )}
                </div>
                 <div className="flex justify-end pt-4">
                      <Button onClick={handleCreateAppointment}>Salvar Agendamento</Button>
                      <DialogClose asChild>
                        <Button id="close-dialog-button" variant="ghost" className="hidden">Close</Button>
                      </DialogClose>
                  </div>
              </DialogContent>
            </Dialog>
          </div>
          <CalendarView selectedDate={selectedDate} onDateChange={setSelectedDate} />
          {dataLoading ? (
            <div className="mt-8 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <ConfirmedAppointments 
              selectedDate={selectedDate}
            />
          )}
        </div>
        <aside className="lg:w-[35%] xl:w-[30%]">
          {dataLoading ? (
             <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
             <PendingAppointments
                isTimeBlocked={isTimeBlocked}
            />
          )}
        </aside>
      </main>
    </div>
  );

    
}

    
