'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { format, getDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Clock, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from "@/hooks/use-toast";
import { acceptRejectAppointment } from '@/ai/flows/accept-reject-appointments';
import { PendingAppointment, Appointment, Service, Funcionario, Block, WorkSchedule } from '@/lib/data';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useData } from '@/contexts/data-context';


function PendingAppointmentCard({ 
  appointment,
  isTimeBlocked,
}: { 
  appointment: PendingAppointment;
  isTimeBlocked: (staffId: string, date: string, time: string, serviceDuration: number) => string | false;
}) {
  const { services, funcionarios } = useData();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  
  const service = useMemo(() => services.find(s => s.id === appointment.serviceId), [services, appointment.serviceId]);

  useEffect(() => {
    // Format date on client to avoid hydration mismatch
    const timeZone = 'UTC';
    const date = toZonedTime(new Date(`${appointment.date}T00:00:00`), timeZone);
    setDisplayDate(format(date, 'dd/MM/yyyy'));
  }, [appointment.date]);

  const filteredStaff = useMemo(() => {
    if (!service) {
      return [];
    }
    return funcionarios.filter(s => s.roleId === service.roleId);
  }, [funcionarios, service]);

  const staffOptions = filteredStaff.map(s => ({ value: s.id, label: s.name }));

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
  
  const handleConfirm = () => {
    if (!selectedStaffId) {
      alert('Selecione o profissional para confirmar.');
      return;
    }
    
    if (!service) {
        alert('Serviço não encontrado.');
        return;
    }
    
    setConflictError('');
    const blockReason = isTimeBlocked(selectedStaffId, appointment.date, appointment.time, service.duration);
    if (blockReason) {
        setConflictError(blockReason);
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
            date: appointment.date,
            client: appointment.client,
            time: appointment.time,
            serviceId: appointment.serviceId,
            staffId: selectedStaffId,
          };
          
          // Atomically move from pending to confirmed
          await setDoc(doc(db, 'confirmedAppointments', newConfirmedAppointment.id), newConfirmedAppointment);
          await deleteDoc(doc(db, 'pendingAppointments', appointment.id));

          await updateStaffSales(selectedStaffId, appointment.serviceId, 'add');

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
           await deleteDoc(doc(db, 'pendingAppointments', appointment.id));
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

  if (!service) {
      return (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-background text-red-500">
              <p>Agendamento pendente inválido (serviço não encontrado).</p>
          </div>
      )
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-background">
      <div className="flex items-center justify-center rounded-full bg-accent shrink-0 size-12">
        <Clock className="text-white h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{appointment.client} - {service.name}</p>
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
                  <p className="text-sm">{service.name}</p>
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
  isTimeBlocked,
}: { 
  isTimeBlocked: (staffId: string, date: string, time: string, serviceDuration: number) => string | false;
}) {
  const { pendingAppointments } = useData();

  return (
    <Card className="bg-card border-border h-fit">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-bold">Agendamentos Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAppointments.length > 0 ? (
          <div className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <PendingAppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                isTimeBlocked={isTimeBlocked}
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
