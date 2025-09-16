'use client';

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Service, Role } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, writeBatch, collection, getDocs, query, where } from 'firebase/firestore';
import { useData } from "@/contexts/data-context";
import { useToast } from "@/hooks/use-toast";


export default function ServicosPage() {
  const { services, roles, loading } = useData();
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const { toast } = useToast();

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | ''>('');
  const [newServiceDuration, setNewServiceDuration] = useState<number | ''>(30);


  const handleAddNewService = async () => {
    if (newServiceName.trim() && newServicePrice && newServiceDuration && selectedRoleId && services && roles) {
      const newServiceId = `s${services.length + 1 + Date.now()}`;
      const newService: Service = {
        id: newServiceId,
        name: newServiceName.trim(),
        price: Number(newServicePrice),
        roleId: selectedRoleId,
        duration: Number(newServiceDuration),
      };
      await setDoc(doc(db, 'services', newServiceId), newService);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration(30);
      setSelectedRoleId('');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if(window.confirm("Tem certeza que deseja deletar este serviço? Todos os agendamentos (confirmados e pendentes) associados a ele também serão removidos.")) {
      try {
        const batch = writeBatch(db);

        // 1. Delete the service itself
        const serviceRef = doc(db, 'services', serviceId);
        batch.delete(serviceRef);

        // 2. Find and delete confirmed appointments with this service
        const confirmedQuery = query(collection(db, 'confirmedAppointments'), where('serviceId', '==', serviceId));
        const confirmedSnapshot = await getDocs(confirmedQuery);
        confirmedSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });

        // 3. Find and delete pending appointments with this service
        const pendingQuery = query(collection(db, 'pendingAppointments'), where('serviceId', '==', serviceId));
        const pendingSnapshot = await getDocs(pendingQuery);
        pendingSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();

        toast({
          title: 'Sucesso!',
          description: 'Serviço e agendamentos associados foram deletados.',
        });

      } catch (error) {
        console.error("Erro ao deletar serviço e agendamentos:", error);
        toast({
          variant: "destructive",
          title: 'Erro',
          description: 'Não foi possível deletar o serviço. Tente novamente.',
        });
      }
    }
  };

  const roleOptions = roles ? roles.map(role => ({ value: role.id, label: role.name })) : [];

  const getRoleName = (roleId: string) => {
    if (!roles) return '';
    return roles.find(role => role.id === roleId)?.name || 'N/A';
  }

  if (loading) {
      return (
          <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-10 w-36 mt-4 md:mt-0" />
              </div>
              <Card>
                  <CardHeader>
                      <Skeleton className="h-8 w-64" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                  </CardContent>
              </Card>
          </main>
      )
  }

  return (
    <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Serviço</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Nome do Serviço</Label>
                  <Input id="service-name" placeholder="Ex: Corte Social" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="service-price">Valor (R$)</Label>
                  <Input id="service-price" type="number" placeholder="Ex: 30.00" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-duration">Duração (minutos)</Label>
                  <Input id="service-duration" type="number" placeholder="Ex: 30" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-select">Função</Label>
                  <Combobox
                    options={roleOptions}
                    value={selectedRoleId}
                    onChange={setSelectedRoleId}
                    placeholder="Selecione a função"
                    searchPlaceholder="Buscar função..."
                    emptyText="Nenhuma função encontrada."
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <DialogClose asChild>
                    <Button onClick={handleAddNewService}>Salvar Serviço</Button>
                  </DialogClose>
                </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{getRoleName(service.roleId)}</TableCell>
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell>
                    {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-destructive" onClick={() => handleDeleteService(service.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
