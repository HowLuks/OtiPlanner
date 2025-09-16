'use client';

import { useMemo, useState } from "react";
import { useData } from "@/contexts/data-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Client, Appointment, Service } from "@/lib/data";
import { subDays, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Phone, Calendar as CalendarIcon, History } from "lucide-react";


function ClientHistoryDialog({ client, appointments, services }: { client: Client, appointments: Appointment[], services: Service[] }) {
    const [isOpen, setIsOpen] = useState(false);

    const clientAppointments = appointments
        .filter(app => app.client.toLowerCase() === client.name.toLowerCase())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const getServiceName = (serviceId: string) => {
        return services.find(s => s.id === serviceId)?.name || 'Serviço desconhecido';
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <History className="mr-2 h-4 w-4" />
                    Ver Histórico
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Histórico de Agendamentos: {client.name}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Serviço</TableHead>
                                <TableHead>Hora</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clientAppointments.length > 0 ? (
                                clientAppointments.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell>{new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                                        <TableCell>{getServiceName(app.serviceId)}</TableCell>
                                        <TableCell>{app.time}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">Nenhum agendamento encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ClientCard({ client, lastAppointmentDate, services, allAppointments }: { client: Client, lastAppointmentDate: Date | null, services: Service[], allAppointments: Appointment[] }) {
    const sixtyDaysAgo = subDays(new Date(), 60);
    const isActive = lastAppointmentDate ? isAfter(lastAppointmentDate, sixtyDaysAgo) : false;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <User />
                        <span>{client.name}</span>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"} className={isActive ? 'bg-green-500/80' : ''}>
                        {isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{client.whatsapp || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Última visita: {lastAppointmentDate ? lastAppointmentDate.toLocaleDateString('pt-BR') : 'N/A'}</span>
                </div>
                <div className="flex justify-end pt-2">
                    <ClientHistoryDialog client={client} appointments={allAppointments} services={services} />
                </div>
            </CardContent>
        </Card>
    )
}

export default function ClientesPage() {
    const { clients, confirmedAppointments, services, loading } = useData();

    const clientData = useMemo(() => {
        return clients.map(client => {
            const clientApps = confirmedAppointments
                .filter(app => app.client.toLowerCase() === client.name.toLowerCase())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const lastAppointment = clientApps[0];
            return {
                client,
                lastAppointmentDate: lastAppointment ? new Date(lastAppointment.date + 'T00:00:00') : null
            };
        }).sort((a, b) => {
            if (!a.lastAppointmentDate) return 1;
            if (!b.lastAppointmentDate) return -1;
            return b.lastAppointmentDate.getTime() - a.lastAppointmentDate.getTime();
        });
    }, [clients, confirmedAppointments]);


    if (loading) {
        return (
            <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-9 w-48 mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <Skeleton className="h-56" />
                    <Skeleton className="h-56" />
                    <Skeleton className="h-56" />
                    <Skeleton className="h-56" />
                    <Skeleton className="h-56" />
                    <Skeleton className="h-56" />
                </div>
            </main>
        )
    }

    return (
        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Clientes</h1>
            
            {clientData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {clientData.map(data => (
                        <ClientCard 
                            key={data.client.id}
                            client={data.client}
                            lastAppointmentDate={data.lastAppointmentDate}
                            services={services}
                            allAppointments={confirmedAppointments}
                        />
                    ))}
                </div>
            ) : (
                 <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <User className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Nenhum cliente encontrado</h3>
                        <p className="text-muted-foreground">Comece a adicionar agendamentos para construir sua lista de clientes.</p>
                    </CardContent>
                </Card>
            )}
        </main>
    )
}
