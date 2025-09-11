'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
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
  onConfirm,
  onReject,
  services,
  staff,
}: { 
  appointment: PendingAppointment;
  onConfirm: (appointmentId: string, newConfirmedAppointment: Appointment) => void;
  onReject: (id: string) => void;
  services: Service[];
  staff: Staff[];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const serviceRole = useMemo(() => {
    const service = services.find(s => s.name === appointment.service);
    return service?.role;
  }, [services, appointment.service]);

  const filteredStaff = useMemo(() => {
    if (!serviceRole) {
      // If role not found, maybe show all? Or just qualified ones if logic allows.
      // For now, returning empty if no role, to be safe.
      return [];
    }
    return staff.filter(s => s.role === serviceRole);
  }, [staff, serviceRole]);

  const staffOptions = filteredStaff.map(s => ({ value: s.id, label: s.name }));

  const handleConfirm = () => {
    if (!selectedStaffId) {
      alert('Selecione o profissional para confirmar.');
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
            client: appointment.client,
            time: appointment.time,
            service: appointment.service,
            staffId: selectedStaffId,
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

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-background">
      <div className="flex items-center justify-center rounded-full bg-accent shrink-0 size-12">
        <Clock className="text-white h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{appointment.client} - {appointment.service}</p>
        <p className="text-sm text-muted-foreground">{appointment.time}</p>
      </div>
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Cliente</Label>
                <span className="col-span-3">{appointment.client}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Serviço</Label>
                <span className="col-span-3">{appointment.service}</span>
              </div>
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
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={handleConfirm} disabled={isPending}>Confirmar Agendamento</Button>
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
  setConfirmedAppointments,
  services,
  staff
}: { 
  pendingAppointments: PendingAppointment[];
  setPendingAppointments: (value: PendingAppointment[] | ((val: PendingAppointment[]) => PendingAppointment[])) => void;
  setConfirmedAppointments: (value: Appointment[] | ((val: Appointment[]) => Appointment[])) => void;
  services: Service[];
  staff: Staff[];
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConfirm = (pendingAppointmentId: string, newConfirmedAppointment: Appointment) => {
    setConfirmedAppointments(current => [...current, newConfirmedAppointment].sort((a, b) => a.time.localeCompare(b.time)));
    setPendingAppointments(current => current.filter(app => app.id !== pendingAppointmentId));
  };

  const handleReject = (appointmentId: string) => {
    setPendingAppointments(current => current.filter(app => app.id !== appointmentId));
  };


  return (
    <Card className="bg-card border-border h-fit">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-bold">Agendamentos Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        {isClient && pendingAppointments.length > 0 ? (
          <div className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <PendingAppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                onConfirm={handleConfirm}
                onReject={handleReject}
                services={services}
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
