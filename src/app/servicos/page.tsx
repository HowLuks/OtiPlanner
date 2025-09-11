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
import { Plus } from "lucide-react";
import { initialServices, initialRoles, Service, Role } from "@/lib/data";
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
import useLocalStorage from "@/lib/storage";


export default function ServicosPage() {
  const [services, setServices] = useLocalStorage<Service[]>('services', initialServices);
  const [roles] = useLocalStorage<Role[]>('roles', initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | ''>('');
  const [newServiceDuration, setNewServiceDuration] = useState<number | ''>(30);

  const handleAddNewService = () => {
    if (newServiceName.trim() && newServicePrice && newServiceDuration && selectedRoleId) {
      const newService: Service = {
        id: `s${services.length + 1 + Date.now()}`,
        name: newServiceName.trim(),
        price: Number(newServicePrice),
        roleId: selectedRoleId,
        duration: Number(newServiceDuration),
      };
      setServices([...services, newService]);
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDuration(30);
      setSelectedRoleId('');
    }
  };

  const roleOptions = roles.map(role => ({ value: role.id, label: role.name }));

  const getRoleName = (roleId: string) => {
    return roles.find(role => role.id === roleId)?.name || 'N/A';
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
