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
import useLocalStorage from '@/lib/storage';
import { initialServices, initialStaff, Service, Staff, Appointment, PendingAppointment, initialConfirmedAppointments, initialPendingAppointments } from '@/lib/data';

export default function Home() {
  const [services] = useLocalStorage<Service[]>('services', initialServices);
  const [staff] = useLocalStorage<Staff[]>('staff', initialStaff);
  const [confirmedAppointments, setConfirmedAppointments] = useLocalStorage<Appointment[]>('confirmedAppointments', initialConfirmedAppointments);
  const [pendingAppointments, setPendingAppointments] = useLocalStorage<PendingAppointment[]>('pendingAppointments', initialPendingAppointments);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [clientName, setClientName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState<'confirmed' | 'pending'>('pending');
  const [conflictError, setConflictError] = useState('');

  const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);

  const filteredStaff = useMemo(() => {
    if (!selectedService) {
      return staff;
    }
    return staff.filter(s => s.role === selectedService.role);
  }, [staff, selectedService]);

  const staffOptions = filteredStaff.map(s => ({ value: s.id, label: s.name }));
  const serviceOptions = services.map(s => ({ value: s.id, label: `${s.name} - R$${s.price}` }));

  const resetForm = () => {
    setClientName('');
    setSelectedServiceId('');
    setSelectedStaffId('');
    setAppointmentDate(format(selectedDate || new Date(), 'yyyy-MM-dd'));
    setAppointmentTime('');
    setAppointmentStatus('pending');
    setConflictError('');
  };

  const checkForConflict = (staffId: string, date: string, time: string, duration: number): boolean => {
    const newAppointmentStart = new Date(`${date}T${time}`).getTime();
    const newAppointmentEnd = newAppointmentStart + duration * 60 * 1000;

    return confirmedAppointments.some(existing => {
      if (existing.staffId !== staffId || existing.date !== date) {
        return false;
      }
      const existingStart = new Date(`${existing.date}T${existing.time}`).getTime();
      const existingEnd = existingStart + existing.duration * 60 * 1000;

      // Check for overlap
      return (newAppointmentStart < existingEnd && newAppointmentEnd > existingStart);
    });
  };

  const handleCreateAppointment = () => {
    if (!clientName || !appointmentTime || !selectedService || !appointmentDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setConflictError('');

    if (appointmentStatus === 'confirmed') {
      if (!selectedStaffId) {
        alert('Para agendamentos confirmados, o profissional é obrigatório.');
        return;
      }

      if (checkForConflict(selectedStaffId, appointmentDate, appointmentTime, selectedService.duration)) {
        setConflictError('Este profissional já possui um agendamento conflitante neste horário.');
        return;
      }

      const newConfirmedAppointment: Appointment = {
        id: `c${confirmedAppointments.length + Date.now()}`,
        date: appointmentDate,
        client: clientName,
        time: appointmentTime,
        service: selectedService.name,
        staffId: selectedStaffId,
        duration: selectedService.duration,
      };
      setConfirmedAppointments(prev => [...prev, newConfirmedAppointment]);
    } else {
      const newPendingAppointment: PendingAppointment = {
        id: `p${pendingAppointments.length + Date.now()}`,
        date: appointmentDate,
        client: clientName,
        time: appointmentTime,
        service: selectedService,
      };
      setPendingAppointments(prev => [...prev, newPendingAppointment]);
    }

    resetForm();
    // This is a bit of a hack to make DialogClose work with the conditional error
    if (!conflictError) {
      document.getElementById('close-dialog-button')?.click();
    }
  };
  
  useEffect(() => {
    if (selectedService && !filteredStaff.find(s => s.id === selectedStaffId)) {
      setSelectedStaffId('');
    }
  }, [selectedService, filteredStaff, selectedStaffId]);

  useEffect(() => {
    setAppointmentDate(format(selectedDate || new Date(), 'yyyy-MM-dd'));
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
          <ConfirmedAppointments selectedDate={selectedDate} />
        </div>
        <aside className="lg:w-[35%] xl:w-[30%]">
           <PendingAppointments
            pendingAppointments={pendingAppointments}
            setPendingAppointments={setPendingAppointments}
            confirmedAppointments={confirmedAppointments}
            setConfirmedAppointments={setConfirmedAppointments}
            services={services}
            staff={staff}
          />
        </aside>
      </main>
    </div>
  );
}

    