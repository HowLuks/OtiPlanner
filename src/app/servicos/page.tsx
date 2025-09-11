'use client';

import { useState, useEffect } from "react";
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
import { Plus } from "lucide-react";
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
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';


export default function ServicosPage() {
  const { user, loading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[] | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | ''>('');
  const [newServiceDuration, setNewServiceDuration] = useState<number | ''>(30);

  useEffect(() => {
    if (!authLoading && user) {
      const unsubServices = onSnapshot(collection(db, 'services'), (snapshot) => {
          setServices(snapshot.docs.map(doc => doc.data() as Service));
      });

      const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
          setRoles(snapshot.docs.map(doc => doc.data() as Role));
      });

      return () => {
          unsubServices();
          unsubRoles();
      };
    }
  }, [user, authLoading]);


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

  const roleOptions = roles ? roles.map(role => ({ value: role.id, label: role.name })) : [];

  const getRoleName = (roleId: string) => {
    if (!roles) return '';
    return roles.find(role => role.id === roleId)?.name || 'N/A';
  }

  const isLoading = authLoading || !services || !roles;

  if (isLoading) {
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
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{getRoleName(service.roleId)}</TableCell>
                  <TableCell>{service.duration} min</TableCell>
                  <TableCell className="text-right">
                    {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
