'use client';

import { useState, useTransition, useMemo } from 'react';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { Clock, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from "@/hooks/use-toast";
import { acceptRejectAppointment } from '@/ai/flows/accept-reject-appointments';
import { PendingAppointment, Appointment, Service, Staff } from '@/lib/data';

function PendingAppointmentCard({ 
  appointment,
  confirmedAppointments,
  onConfirm,
  onReject,
  staff,
}: { 
  appointment: PendingAppointment;
  confirmedAppointments: Appointment[];
  onConfirm: (appointmentId: string, newConfirmedAppointment: Appointment) => void;
  onReject: (id: string) => void;
  staff: Staff[];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [conflictError, setConflictError] = useState('');

  const filteredStaff = useMemo(() => {
    if (!appointment.service || !appointment.service.role) {
      return [];
    }
    return staff.filter(s => s.role === appointment.service.role);
  }, [staff, appointment.service]);

  const staffOptions = filteredStaff.map(s => ({ value: s.id, label: s.name }));

  const checkForConflict = (staffId: string, date: string, time: string, duration: number): boolean => {
    // Add timezone handling to avoid off-by-one day errors
    const newAppointmentStart = utcToZonedTime(new Date(`${date}T${time}`), 'UTC').getTime();
    const newAppointmentEnd = newAppointmentStart + duration * 60 * 1000;

    return confirmedAppointments.some(existing => {
      if (existing.staffId !== staffId || existing.date !== date) {
        return false;
      }
      const existingStart = utcToZonedTime(new Date(`${existing.date}T${existing.time}`), 'UTC').getTime();
      const existingEnd = existingStart + existing.duration * 60 * 1000;
      
      return (newAppointmentStart < existingEnd && newAppointmentEnd > existingStart);
    });
  };

  const handleConfirm = () => {
    if (!selectedStaffId) {
      alert('Selecione o profissional para confirmar.');
      return;
    }
    
    setConflictError('');
    if (checkForConflict(selectedStaffId, appointment.date, appointment.time, appointment.service.duration)) {
        setConflictError('Este profissional já possui um agendamento conflitante neste horário.');
        return;
    }

    startTransition(async () => {
      try {
        const result = await acceptRejectAppointment({
          appointmentId: appointment.id,
          action: 'accept',
          reason: `User clicked accept`,
        });
        
        if (result.success) {
          const newConfirmedAppointment: Appointment = {
            id: `c${Date.now()}`,
            date: format(utcToZonedTime(new Date(appointment.date), 'UTC'), 'yyyy-MM-dd'),
            client: appointment.client,
            time: appointment.time,
            service: appointment.service.name,
            staffId: selectedStaffId,
            duration: appointment.service.duration,
          };
          onConfirm(appointment.id, newConfirmedAppointment);
          setIsOpen(false);
          toast({
            title: `Agendamento Aceito`,
            description: result.message,
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar a solicitação.',
        });
      }
    });
  }

  const handleReject = () => {
    startTransition(async () => {
      try {
        const result = await acceptRejectAppointment({
          appointmentId: appointment.id,
          action: 'reject',
          reason: `User clicked reject`,
        });
        
        if (result.success) {
          onReject(appointment.id);
          toast({
            title: `Agendamento Rejeitado`,
            description: result.message,
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar a solicitação.',
        });
      }
    });
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setConflictError('');
      setSelectedStaffId('');
    }
  }

  // To fix hydration error, we need to make sure the date is parsed in UTC
  const displayDate = format(utcToZonedTime(new Date(appointment.date), 'UTC'), 'dd/MM/yyyy');

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-background">
      <div className="flex items-center justify-center rounded-full bg-accent shrink-0 size-12">
        <Clock className="text-white h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{appointment.client} - {appointment.service.name}</p>
        <p className="text-sm text-muted-foreground">{displayDate} - {appointment.time}</p>
      </div>
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
             <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/20 text-primary hover:text-primary"
              disabled={isPending}
            >
              <Check className="h-5 w-5" />
              <span className="sr-only">Aceitar</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Agendamento</DialogTitle>
            </DialogHeader>
             <div className="grid grid-cols-2 gap-4 py-4">
               <div className="space-y-1">
                  <Label>Cliente</Label>
                  <p className="text-sm">{appointment.client}</p>
              </div>
              <div className="space-y-1">
                  <Label>Data</Label>
                  <p className="text-sm">{displayDate} - {appointment.time}</p>
              </div>
              <div className="space-y-1 col-span-2">
                  <Label>Serviço</Label>
                  <p className="text-sm">{appointment.service.name}</p>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="staff">Profissional</Label>
                <Combobox
                  options={staffOptions}
                  value={selectedStaffId}
                  onChange={setSelectedStaffId}
                  placeholder="Selecione"
                  searchPlaceholder="Buscar profissional..."
                  emptyText="Nenhum profissional qualificado."
                />
              </div>
              {conflictError && (
                <div className="col-span-2 text-sm text-red-500 text-center p-2 bg-red-500/10 rounded-md">
                    {conflictError}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={handleConfirm} disabled={isPending || !selectedStaffId}>Confirmar Agendamento</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300"
          onClick={handleReject}
          disabled={isPending}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Rejeitar</span>
        </Button>
      </div>
    </div>
  );
}


export function PendingAppointments({ 
  pendingAppointments,
  setPendingAppointments,
  confirmedAppointments,
  setConfirmedAppointments,
  services,
  staff
}: { 
  pendingAppointments: PendingAppointment[];
  setPendingAppointments: (value: PendingAppointment[] | ((val: PendingAppointment[]) => PendingAppointment[])) => void;
  confirmedAppointments: Appointment[];
  setConfirmedAppointments: (value: Appointment[] | ((val: Appointment[]) => Appointment[])) => void;
  services: Service[];
  staff: Staff[];
}) {

  const handleConfirm = (pendingAppointmentId: string, newConfirmedAppointment: Appointment) => {
    setConfirmedAppointments(current => [...current, newConfirmedAppointment].sort((a, b) => a.time.localeCompare(b.time)));
    setPendingAppointments(current => current.filter(app => app.id !== pendingAppointmentId));
  };

  const handleReject = (appointmentId: string) => {
    setPendingAppointments(current => current.filter(app => app.id !== appointmentId));
  };

  const validAppointments = pendingAppointments.filter(app => app.service && app.service.name);

  return (
    <Card className="bg-card border-border h-fit">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-bold">Agendamentos Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        {validAppointments.length > 0 ? (
          <div className="space-y-4">
            {validAppointments.map((appointment) => (
              <PendingAppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                confirmedAppointments={confirmedAppointments}
                onConfirm={handleConfirm}
                onReject={handleReject}
                staff={staff}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum agendamento pendente.</p>
        )}
      </CardContent>
    </Card>
  );
}
