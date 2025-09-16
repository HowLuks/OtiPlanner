'use client';

import { useMemo, useState } from "react";
import { useData } from "@/contexts/data-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Client, Appointment, Service } from "@/lib/data";
import { subDays, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Phone, Calendar as CalendarIcon, History, Plus, MessageCircle } from "lucide-react";
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


function AddClientDialog({ onClientAdded }: { onClientAdded: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const { clients } = useData();
    const { toast } = useToast();

    const handleSave = async () => {
        if (!name.trim() || !whatsapp.trim()) {
            toast({
                variant: "destructive",
                title: "Erro de Validação",
                description: "O nome e o WhatsApp do cliente são obrigatórios.",
            });
            return;
        }

        const normalizedName = name.trim().toLowerCase();
        const existingClient = clients.find(c => c.name.toLowerCase() === normalizedName);

        if (existingClient) {
            toast({
                variant: "destructive",
                title: "Cliente Duplicado",
                description: "Um cliente com este nome já existe.",
            });
            return;
        }
        
        try {
            const newClientId = `client-${Date.now()}`;
            const newClient: Client = {
                id: newClientId,
                name: name.trim(),
                whatsapp: whatsapp.trim()
            };
            await setDoc(doc(db, 'clients', newClientId), newClient);
            toast({
                title: "Sucesso!",
                description: "Novo cliente adicionado.",
            });
            onClientAdded();
            setIsOpen(false);
            setName('');
            setWhatsapp('');
        } catch (error) {
            console.error("Erro ao adicionar cliente:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível adicionar o cliente.",
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="client-name">Nome do Cliente</Label>
                        <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client-whatsapp">WhatsApp</Label>
                        <Input id="client-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Número do WhatsApp com DDD" />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave}>Salvar Cliente</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function BroadcastDialog({ clientData }: { clientData: { client: Client; lastAppointmentDate: Date | null; isActive: boolean; }[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [generatedLinks, setGeneratedLinks] = useState<{ name: string; link: string; }[]>([]);

    const generateLinks = () => {
        const sixtyDaysAgo = subDays(new Date(), 60);
        let targetClients: Client[] = [];

        const clientsWithWhatsapp = clientData.filter(cd => cd.client.whatsapp).map(cd => cd.client);

        if (filter === 'all') {
            targetClients = clientsWithWhatsapp;
        } else if (filter === 'active') {
            targetClients = clientData.filter(cd => cd.isActive && cd.client.whatsapp).map(cd => cd.client);
        } else { // inactive
            targetClients = clientData.filter(cd => !cd.isActive && cd.client.whatsapp).map(cd => cd.client);
        }
        
        const encodedMessage = encodeURIComponent(message);
        const links = targetClients.map(client => {
            // Basic normalization: remove non-digits
            const phone = client.whatsapp.replace(/\D/g, '');
            return {
                name: client.name,
                link: `https://wa.me/${phone}?text=${encodedMessage}`
            }
        });
        setGeneratedLinks(links);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state when closing
            setMessage('');
            setFilter('all');
            setGeneratedLinks([]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Fazer Disparos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Disparo de Mensagens via WhatsApp</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Selecione o público</Label>
                        <RadioGroup value={filter} onValueChange={(v: 'all' | 'active' | 'inactive') => setFilter(v)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="filter-all" />
                                <Label htmlFor="filter-all">Todos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="active" id="filter-active" />
                                <Label htmlFor="filter-active">Ativos</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inactive" id="filter-inactive" />
                                <Label htmlFor="filter-inactive">Inativos</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="broadcast-message">Mensagem</Label>
                        <Textarea
                            id="broadcast-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Digite sua mensagem aqui... ela será pré-preenchida no WhatsApp de cada cliente."
                            rows={5}
                        />
                    </div>
                </div>
                {generatedLinks.length > 0 ? (
                    <div className="space-y-3 pt-4 border-t max-h-[40vh] overflow-y-auto">
                        <h4 className="font-medium">Links Gerados</h4>
                         {generatedLinks.map(({ name, link }) => (
                            <Button key={link} asChild variant="secondary" className="w-full justify-start">
                                <a href={link} target="_blank" rel="noopener noreferrer">
                                    Enviar para {name}
                                </a>
                            </Button>
                        ))}
                    </div>
                ) : (
                    <div className="flex justify-end pt-2">
                        <Button onClick={generateLinks} disabled={!message.trim()}>Gerar Links de Disparo</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

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

function ClientCard({ client, lastAppointmentDate, isActive, services, allAppointments }: { client: Client, lastAppointmentDate: Date | null, isActive: boolean, services: Service[], allAppointments: Appointment[] }) {

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
    const { clients, confirmedAppointments, services, loading, fetchData } = useData();

    const clientData = useMemo(() => {
        const sixtyDaysAgo = subDays(new Date(), 60);
        return clients.map(client => {
            const clientApps = confirmedAppointments
                .filter(app => app.client.toLowerCase() === client.name.toLowerCase())
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const lastAppointment = clientApps[0];
            const lastAppointmentDate = lastAppointment ? new Date(lastAppointment.date + 'T00:00:00') : null
            const isActive = lastAppointmentDate ? isAfter(lastAppointmentDate, sixtyDaysAgo) : false;

            return {
                client,
                lastAppointmentDate,
                isActive
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
                 <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-9 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-36" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
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
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                <div className="flex items-center gap-2">
                    <BroadcastDialog clientData={clientData} />
                    <AddClientDialog onClientAdded={fetchData} />
                </div>
            </div>
            
            {clientData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {clientData.map(data => (
                        <ClientCard 
                            key={data.client.id}
                            client={data.client}
                            lastAppointmentDate={data.lastAppointmentDate}
                            isActive={data.isActive}
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
                        <p className="text-muted-foreground">Comece a adicionar agendamentos ou cadastre um novo cliente.</p>
                    </CardContent>
                </Card>
            )}
        </main>
    )
}

    