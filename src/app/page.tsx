'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, getDay } from 'date-fns';
import { AppHeader } from "@/components/header";
import { CalendarView } from "@/components/calendar-view";
import { ConfirmedAppointments } from "@/components/confirmed-appointments";
import { PendingAppointments } from "@/components/pending-appointments";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Plus } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { dayLabels } from '@/lib/constants';

export default function Home() {
  const { 
    services, 
    funcionarios, 
    confirmedAppointments, 
    blocks,
    workSchedules,
    appSettings,
    loading: dataLoading 
  } = useData();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [conflictError, setConflictError] = useState('');
  const { toast } = useToast();
  

  const selectedService = useMemo(() => {
      return services.find(s => s.id === selectedServiceId)
    }, [services, selectedServiceId]);

  const isTimeBlocked = (staffId: string, date: string, time: string, serviceDuration: number): boolean => {
    if (!time) return false;
    
    const newAppointmentStart = new Date(`${date}T${time}`).getTime();
    const newAppointmentEnd = newAppointmentStart + serviceDuration * 60 * 1000;

    const hasConflictAppointment = confirmedAppointments.some(existing => {
        if (existing.staffId !== staffId || existing.date !== date) return false;
        const existingService = services.find(s => s.id === existing.serviceId);
        if (!existingService) return false;
        const existingStart = new Date(`${existing.date}T${existing.time}`).getTime();
        const existingEnd = existingStart + existingService.duration * 60 * 1000;
        return newAppointmentStart < existingEnd && newAppointmentEnd > existingStart;
    });
    if (hasConflictAppointment) return true;

    const hasConflictBlock = blocks.some(block => {
        if (block.staffId !== staffId || block.date !== date) return false;
        const blockStart = new Date(`${block.date}T${block.startTime}`).getTime();
        const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime();
        return newAppointmentStart < blockEnd && newAppointmentEnd > blockStart;
    });
    if (hasConflictBlock) return true;
    
    const schedule = workSchedules.find(ws => ws.staffId === staffId);
    if (schedule) {
        const dayIndex = getDay(new Date(`${date}T00:00:00`));
        const dayOfWeek = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dayIndex];
        const workHours = schedule.horarios[dayOfWeek as keyof typeof schedule.horarios];

        if (!workHours || !workHours.start || !workHours.end) {
            return true; // Does not work on this day
        }

        const workStart = new Date(`${date}T${workHours.start}`).getTime();
        const workEnd = new Date(`${date}T${workHours.end}`).getTime();

        if (newAppointmentStart < workStart || newAppointmentEnd > workEnd) {
            return true; // Outside of working hours
        }
    } else {
        return true; // No schedule found, assume unavailable
    }

    return false;
  };
  
  const getConflictReason = (staffId: string, date: string, time: string, serviceDuration: number): string | false => {
    if (!time) return false;

    const newAppointmentStart = new Date(`${date}T${time}`).getTime();
    const newAppointmentEnd = newAppointmentStart + serviceDuration * 60 * 1000;

    const conflictAppointment = confirmedAppointments.find(existing => {
        if (existing.staffId !== staffId || existing.date !== date) return false;
        const existingService = services.find(s => s.id === existing.serviceId);
        if (!existingService) return false;
        const existingStart = new Date(`${existing.date}T${existing.time}`).getTime();
        const existingEnd = existingStart + existingService.duration * 60 * 1000;
        return newAppointmentStart < existingEnd && newAppointmentEnd > existingStart;
    });
    if (conflictAppointment) return 'Este profissional já possui um agendamento conflitante neste horário.';

    const conflictBlock = blocks.find(block => {
        if (block.staffId !== staffId || block.date !== date) return false;
        const blockStart = new Date(`${block.date}T${block.startTime}`).getTime();
        const blockEnd = new Date(`${block.date}T${block.endTime}`).getTime();
        return newAppointmentStart < blockEnd && newAppointmentEnd > blockStart;
    });
    if (conflictBlock) return 'O profissional tem um bloqueio de tempo neste horário.';
    
    const schedule = workSchedules.find(ws => ws.staffId === staffId);
    if (schedule) {
        const dayIndex = getDay(new Date(`${date}T00:00:00`));
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
    } else {
         return 'O profissional não possui uma carga horária definida.';
    }

    return false;
  };

  const qualifiedStaff = useMemo(() => {
    if (!selectedService) return [];
    return funcionarios.filter(s => s.roleId === selectedService.roleId);
  }, [funcionarios, selectedService]);


  const availableStaff = useMemo(() => {
    if (!selectedService || !appointmentDate || !appointmentTime) {
      return qualifiedStaff;
    }
    return qualifiedStaff.filter(staff => 
      !isTimeBlocked(staff.id, appointmentDate, appointmentTime, selectedService.duration)
    );
  }, [qualifiedStaff, appointmentDate, appointmentTime, selectedService, isTimeBlocked]);


  const staffOptions = useMemo(() => {
    return availableStaff.map(s => ({ value: s.id, label: s.name }));
  }, [availableStaff]);


  const serviceOptions = useMemo(() => {
    return services.map(s => ({ value: s.id, label: `${s.name} - R$${s.price}` }));
  }, [services]);

  const resetForm = () => {
    setClientName('');
    setClientWhatsapp('');
    setSelectedServiceId('');
    setSelectedStaffId('');
    setAppointmentDate(format(selectedDate || new Date(), 'yyyy-MM-dd'));
    setAppointmentTime('');
    setConflictError('');
  };
  
  const handleCreateAppointment = async () => {
    if (!clientName || !clientWhatsapp || !appointmentTime || !selectedServiceId || !appointmentDate) {
      setConflictError('Por favor, preencha todos os campos obrigatórios: Cliente, WhatsApp, Data, Horário e Serviço.');
      return;
    }
    setConflictError('');

    if (!selectedService) {
      setConflictError('Serviço não encontrado. Por favor, selecione um serviço válido.');
      return;
    }

    // If a staff member is selected, double-check for conflicts before submitting
    if (selectedStaffId) {
        const conflictReason = getConflictReason(selectedStaffId, appointmentDate, appointmentTime, selectedService.duration);
        if (conflictReason) {
            setConflictError(conflictReason);
            return;
        }
    }

    try {
        const payload = {
            clientName,
            clientWhatsapp,
            appointmentDate,
            appointmentTime,
            selectedServiceId,
            selectedStaffId: selectedStaffId || undefined,
        };
        
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || 'Falha ao criar agendamento');
        }

        toast({ title: "Sucesso!", description: `Agendamento para ${clientName} criado.` });
        resetForm();
        setIsDialogOpen(false);
    } catch(error) {
        setConflictError(error instanceof Error ? error.message : "Erro desconhecido ao salvar. Tente novamente.");
    }
  };

  useEffect(() => {
    // If the selected staff member is no longer in the available list, reset it.
    if (selectedStaffId && !availableStaff.find(s => s.id === selectedStaffId)) {
      setSelectedStaffId('');
    }
  }, [availableStaff, selectedStaffId]);

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
             <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Cliente</Label>
                    <Input id="client-name" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-whatsapp">WhatsApp</Label>
                    <Input id="client-whatsapp" value={clientWhatsapp} onChange={e => setClientWhatsapp(e.target.value)} placeholder="WhatsApp do cliente" />
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appointment-date">Data</Label>
                      <Input id="appointment-date" type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appointment-time">Horário</Label>
                      <Input id="appointment-time" type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service">Serviço</Label>
                    <Combobox
                        options={serviceOptions}
                        value={selectedServiceId}
                        onChange={setSelectedServiceId}
                        placeholder="Selecione um serviço"
                        searchPlaceholder="Buscar serviço..."
                        emptyText="Nenhum serviço encontrado."
                      />
                  </div>
                  
                  {appSettings?.manualSelection && (
                    <div className="space-y-2">
                      <Label htmlFor="staff">Profissional</Label>
                      <Combobox
                          options={staffOptions}
                          value={selectedStaffId}
                          onChange={setSelectedStaffId}
                          placeholder="Deixar pendente"
                          searchPlaceholder="Buscar profissional..."
                          emptyText="Nenhum profissional disponível."
                          />
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
                  </div>
              </DialogContent>
            </Dialog>
          </div>
          <CalendarView selectedDate={selectedDate} onDateChange={setSelectedDate} />
          {dataLoading ? (
            <div className="mt-8 space-y-4">
              <h3 className="text-2xl font-bold mb-4 font-headline">Agendamentos Confirmados</h3>
              <div className="border rounded-lg p-4">
                <div className="h-40 w-full animate-pulse bg-muted rounded-md" />
              </div>
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
                <h3 className="text-2xl font-bold mb-4 font-headline">Agendamentos Pendentes</h3>
                <div className="border rounded-lg p-4 space-y-4">
                    <div className="h-16 w-full animate-pulse bg-muted rounded-md" />
                    <div className="h-16 w-full animate-pulse bg-muted rounded-md" />
                    <div className="h-16 w-full animate-pulse bg-muted rounded-md" />
                </div>
            </div>
          ) : (
             <PendingAppointments
                isTimeBlocked={getConflictReason}
            />
          )}
        </aside>
      </main>
    </div>
  );
}
