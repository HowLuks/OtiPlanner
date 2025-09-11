'use client'

import { useMemo } from "react";
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
import { Funcionario, Appointment, Service } from "@/lib/data";

interface ConfirmedAppointmentsProps {
  selectedDate: Date | undefined;
  confirmedAppointments: Appointment[];
  setConfirmedAppointments: (value: Appointment[] | ((val: Appointment[]) => Appointment[])) => void;
  staff: Funcionario[];
  services: Service[];
}

export function ConfirmedAppointments({ selectedDate, confirmedAppointments, staff, services }: ConfirmedAppointmentsProps) {
  const getStaffMember = (staffId: string): Funcionario | undefined => {
    return staff.find(s => s.id === staffId);
  };
  
  const getService = (serviceId: string): Service | undefined => {
      return services.find(s => s.id === serviceId);
  }

  const filteredAppointments = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return confirmedAppointments
      .filter(app => app.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [confirmedAppointments, selectedDate]);

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
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
                           <Avatar className="h-10 w-10">
                              <AvatarImage src={staffMember.avatarUrl} alt={staffMember.name} data-ai-hint={staffMember.avatarHint} />
                              <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum agendamento para esta data.
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
