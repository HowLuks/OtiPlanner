'use client'

import { useMemo, useState, useEffect } from "react";
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Funcionario, Appointment, Service } from "@/lib/data";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, setDoc } from "firebase/firestore";
import { useData } from "@/contexts/data-context";


interface ConfirmedAppointmentsProps {
  selectedDate: Date | undefined;
}

export function ConfirmedAppointments({ 
  selectedDate
}: ConfirmedAppointmentsProps) {
  const [isClient, setIsClient] = useState(false);
  const { confirmedAppointments, staff, services, funcionarios } = useData();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStaffMember = (staffId: string): Funcionario | undefined => {
    return staff.find(s => s.id === staffId);
  };
  
  const getService = (serviceId: string): Service | undefined => {
      return services.find(s => s.id === serviceId);
  }

  const filteredAppointments = useMemo(() => {
    if (!selectedDate || !isClient) {
      return [];
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return confirmedAppointments
      .filter(app => app.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [confirmedAppointments, selectedDate, isClient]);

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

  const handleDelete = async (appointmentToDelete: Appointment) => {
    if(window.confirm("Tem certeza que deseja excluir este agendamento?")){
      await deleteDoc(doc(db, "confirmedAppointments", appointmentToDelete.id));
      await updateStaffSales(appointmentToDelete.staffId, appointmentToDelete.serviceId, 'subtract');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-4 font-headline">Agendamentos Confirmados</h3>
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-4 font-medium text-sm">Horário</TableHead>
                <TableHead className="px-6 py-4 font-medium text-sm">Cliente</TableHead>
                <TableHead className="px-6 py-4 font-medium text-sm">Serviço</TableHead>
                <TableHead className="px-6 py-4 font-medium text-sm">Funcionário</TableHead>
                <TableHead className="px-6 py-4 font-medium text-sm text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient && filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const staffMember = getStaffMember(appointment.staffId);
                  const service = getService(appointment.serviceId);
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">{appointment.time}</TableCell>
                      <TableCell className="px-6 py-4 text-sm font-medium">{appointment.client}</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">{service?.name || 'Serviço não encontrado'}</TableCell>
                      <TableCell className="px-6 py-4">
                        {staffMember && (
                           <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={staffMember.avatarUrl} alt={staffMember.name} data-ai-hint={staffMember.avatarHint} />
                                  <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                           </div>
                        )}
                      </TableCell>
                       <TableCell className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-destructive" onClick={() => handleDelete(appointment)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {isClient ? "Nenhum agendamento para esta data." : "Carregando..."}
                    </TableCell>
                  </TableRow>              
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
