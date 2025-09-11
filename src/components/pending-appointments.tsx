'use client';

import { useState, useTransition } from 'react';
import { Clock, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { acceptRejectAppointment } from '@/ai/flows/accept-reject-appointments';
import { initialPendingAppointments, PendingAppointment } from '@/lib/data';
import useLocalStorage from '@/lib/storage';

function PendingAppointmentCard({ appointment, onAction }: { appointment: PendingAppointment, onAction: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAction = (action: 'accept' | 'reject') => {
    startTransition(async () => {
      try {
        const result = await acceptRejectAppointment({
          appointmentId: appointment.id,
          action,
          reason: `User clicked ${action}`,
        });
        
        if (result.success) {
          toast({
            title: `Agendamento ${action === 'accept' ? 'Aceito' : 'Rejeitado'}`,
            description: result.message,
          });
          onAction(appointment.id);
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
        <p className="font-medium">{appointment.client}</p>
        <p className="text-sm text-muted-foreground">{appointment.time}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-primary/20 text-primary hover:text-primary"
          onClick={() => handleAction('accept')}
          disabled={isPending}
        >
          <Check className="h-5 w-5" />
          <span className="sr-only">Aceitar</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-red-500/20 text-red-400 hover:text-red-300"
          onClick={() => handleAction('reject')}
          disabled={isPending}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Rejeitar</span>
        </Button>
      </div>
    </div>
  );
}


export function PendingAppointments() {
  const [appointments, setAppointments] = useLocalStorage<PendingAppointment[]>('pendingAppointments', initialPendingAppointments);

  const handleAction = (appointmentId: string) => {
    setAppointments(currentAppointments => currentAppointments.filter(app => app.id !== appointmentId));
  };

  return (
    <Card className="bg-card border-border h-fit">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-bold">Agendamentos Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <PendingAppointmentCard key={appointment.id} appointment={appointment} onAction={handleAction} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum agendamento pendente.</p>
        )}
      </CardContent>
    </Card>
  );
}
