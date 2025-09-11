'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
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
import { Service, Funcionario, Appointment, PendingAppointment } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { db, seedDatabase } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useData } from '@/contexts/data-context';

export default function Home() {
  const { 
    services, 
    funcionarios, 
    confirmedAppointments, 
    pendingAppointments, 
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

  const checkForConflict = (staffId: string, date: string, time: string): boolean => {
    const serviceForNewApp = services.find(s => s.id === selectedServiceId);
    if (!serviceForNewApp) return false;

    const newAppointmentStart = new Date(`${date}T${time}`).getTime();
    const newAppointmentEnd = newAppointmentStart + serviceForNewApp.duration * 60 * 1000;

    return confirmedAppointments.some(existing => {
      if (existing.staffId !== staffId || existing.date !== date) {
        return false;
      }
      const existingService = services.find(s => s.id === existing.serviceId);
      if (!existingService) return false;

      const existingStart = new Date(`${existing.date}T${existing.time}`).getTime();
      const existingEnd = existingStart + existingService.duration * 60 * 1000;

      // Check for overlap
      return (newAppointmentStart < existingEnd && newAppointmentEnd > existingStart);
    });
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

  const handleCreateAppointment = async () => {
    if (!clientName || !appointmentTime || !selectedServiceId || !appointmentDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setConflictError('');

    if (appointmentStatus === 'confirmed') {
      if (!selectedStaffId) {
        alert('Para agendamentos confirmados, o profissional é obrigatório.');
        return;
      }

      if (checkForConflict(selectedStaffId, appointmentDate, appointmentTime)) {
        setConflictError('Este profissional já possui um agendamento conflitante neste horário.');
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

    } else {
      const newId = `p${(pendingAppointments?.length || 0) + Date.now()}`;
      const newPendingAppointment: PendingAppointment = {
        id: newId,
        date: appointmentDate,
        client: clientName,
        time: appointmentTime,
        serviceId: selectedServiceId,
      };
      await setDoc(doc(db, 'pendingAppointments', newId), newPendingAppointment);
    }

    resetForm();
    // This is a bit of a hack to make DialogClose work with the conditional error
    if (!conflictError) {
      document.getElementById('close-dialog-button')?.click();
    }
  };
  
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
                    <>
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
                    </>
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
              confirmedAppointments={confirmedAppointments}
              services={services}
              staff={funcionarios}
              updateStaffSales={updateStaffSales}
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
                pendingAppointments={pendingAppointments}
                confirmedAppointments={confirmedAppointments}
                services={services}
                staff={funcionarios}
                updateStaffSales={updateStaffSales}
            />
          )}
        </aside>
      </main>
    </div>
  );

    
}
