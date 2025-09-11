'use client'

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
import { initialConfirmedAppointments, initialStaff, Staff, Appointment } from "@/lib/data";
import useLocalStorage from "@/lib/storage";


const getStaffMember = (staff: Staff[], staffId: string): Staff | undefined => {
  return staff.find(s => s.id === staffId);
};

export function ConfirmedAppointments() {
  const [confirmedAppointments] = useLocalStorage<Appointment[]>('confirmedAppointments', initialConfirmedAppointments);
  const [staff] = useLocalStorage<Staff[]>('staff', initialStaff);

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
              {confirmedAppointments.map((appointment) => {
                const staffMember = getStaffMember(staff, appointment.staffId);
                return (
                  <TableRow key={appointment.id}>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">{appointment.time}</TableCell>
                    <TableCell className="px-6 py-4 text-sm font-medium">{appointment.client}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">{appointment.service}</TableCell>
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
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
