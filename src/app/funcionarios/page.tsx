'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { Edit, Trash, Plus, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialRoles, initialFuncionarios, Funcionario } from "@/lib/data";
import { Combobox } from '@/components/ui/combobox';
import useLocalStorage from '@/lib/storage';

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useLocalStorage<Funcionario[]>('funcionarios', initialFuncionarios);
  const [roles, setRoles] = useLocalStorage<string[]>('roles', initialRoles);
  
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);
  const [newEmployeeRole, setNewEmployeeRole] = useState('');
  const [editEmployeeRole, setEditEmployeeRole] = useState('');

  const [newRoleName, setNewRoleName] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeePhoto, setNewEmployeePhoto] = useState<string | null>(null);
  const [newEmployeeSalesTarget, setNewEmployeeSalesTarget] = useState<number | ''>(2000);
  const [editEmployeeName, setEditEmployeeName] = useState('');
  const [editEmployeePhoto, setEditEmployeePhoto] = useState<string | null>(null);
  const [editSalesTarget, setEditSalesTarget] = useState<number | ''>('');


  const handleEditClick = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario);
    setEditEmployeeRole(funcionario.role.toLowerCase());
    setEditEmployeeName(funcionario.name);
    setEditEmployeePhoto(funcionario.avatarUrl);
    setEditSalesTarget(funcionario.salesTarget);
  };
  
  const handleAddNewRole = () => {
    if (newRoleName.trim() !== '' && !roles.find(r => r.toLowerCase() === newRoleName.toLowerCase())) {
      setRoles([...roles, newRoleName.trim()]);
      setNewRoleName('');
    }
  };

  const handleAddNewEmployee = () => {
    if (newEmployeeName.trim() && newEmployeeRole) {
      const newEmployee: Funcionario = {
        id: (funcionarios.length + 1).toString(),
        name: newEmployeeName.trim(),
        role: roles.find(r => r.toLowerCase() === newEmployeeRole) || '',
        avatarUrl: newEmployeePhoto || "https://picsum.photos/seed/new/112/112",
        avatarHint: 'person portrait',
        salesGoal: 0,
        salesValue: 0,
        salesTarget: Number(newEmployeeSalesTarget) || 2000,
      };
      setFuncionarios([...funcionarios, newEmployee]);
      setNewEmployeeName('');
      setNewEmployeeRole('');
      setNewEmployeePhoto(null);
      setNewEmployeeSalesTarget(2000);
    }
  };

  const handleUpdateEmployee = () => {
    if (selectedFuncionario && editEmployeeName.trim() && editEmployeeRole) {
      setFuncionarios(funcionarios.map(f =>
        f.id === selectedFuncionario.id
          ? {
              ...f,
              name: editEmployeeName.trim(),
              role: roles.find(r => r.toLowerCase() === editEmployeeRole) || f.role,
              avatarUrl: editEmployeePhoto || f.avatarUrl,
            }
          : f
      ));
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setFuncionarios(funcionarios.filter(f => f.id !== id));
  };
  
  const handleUpdateSalesTarget = () => {
     if (selectedFuncionario && editSalesTarget) {
      setFuncionarios(funcionarios.map(f =>
        f.id === selectedFuncionario.id
          ? {
              ...f,
              salesTarget: Number(editSalesTarget),
              salesGoal: f.salesValue > 0 ? Math.round((f.salesValue / Number(editSalesTarget)) * 100) : 0,
            }
          : f
      ));
    }
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setPhoto: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const roleOptions = roles.map(role => ({ value: role.toLowerCase(), label: role }));
  
  return (
    <>
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
             <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2" />
                  Nova Função
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Função</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-role">Nome da Função</Label>
                    <Input id="new-role" placeholder="Ex: Esteticista" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                  </div>
                  <div className="flex justify-end pt-4">
                    <DialogClose asChild>
                      <Button onClick={handleAddNewRole}>Salvar Função</Button>
                    </DialogClose>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Novo Funcionário</DialogTitle>
                </DialogHeader>
                 <div className="space-y-4 p-4">
                  <div className="space-y-2">
                    <Label>Foto</Label>
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        {newEmployeePhoto ? (
                          <Image src={newEmployeePhoto} alt="Preview" width={64} height={64} className="rounded-full object-cover" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="new-photo-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar foto
                          <input id="new-photo-upload" type="file" accept="image/*" className="sr-only" onChange={e => handlePhotoUpload(e, setNewEmployeePhoto)} />
                        </label>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Nome</Label>
                    <Input id="new-name" placeholder="Nome do funcionário" value={newEmployeeName} onChange={e => setNewEmployeeName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-role-select">Função</Label>
                     <Combobox
                        options={roleOptions}
                        value={newEmployeeRole}
                        onChange={setNewEmployeeRole}
                        placeholder="Selecione a função"
                        searchPlaceholder="Buscar função..."
                        emptyText="Nenhuma função encontrada."
                      />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="new-sales-target">Meta de Vendas</Label>
                    <Input
                      id="new-sales-target"
                      type="number"
                      placeholder="2000"
                      value={newEmployeeSalesTarget}
                      onChange={(e) => setNewEmployeeSalesTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                     <DialogClose asChild>
                        <Button onClick={handleAddNewEmployee}>Salvar Funcionário</Button>
                     </DialogClose>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {funcionarios.map((funcionario) => (
            <Dialog key={funcionario.id} onOpenChange={(open) => !open && setSelectedFuncionario(null)}>
              <div className="bg-card rounded-xl p-5 flex flex-col items-center text-center transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
                <div className="relative mb-4">
                  <Image
                    alt={funcionario.name}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-background group-hover:ring-primary transition-all"
                    src={funcionario.avatarUrl}
                    width={112}
                    height={112}
                    data-ai-hint={funcionario.avatarHint}
                  />
                </div>
                <h3 className="font-bold text-lg">{funcionario.name}</h3>
                <p className="text-sm text-muted-foreground">{funcionario.role}</p>
                <div className="w-full mt-5">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                    <span>Meta de Vendas</span>
                    <span className="font-semibold text-primary">{funcionario.salesGoal}%</span>
                  </div>
                  <Progress value={funcionario.salesGoal} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    R$ {funcionario.salesValue.toLocaleString('pt-BR')} / R$ {funcionario.salesTarget.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
                   <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-primary" onClick={() => handleEditClick(funcionario)}>
                          <Edit className="text-xl" />
                      </Button>
                   </DialogTrigger>
                   <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-destructive" onClick={() => handleDeleteEmployee(funcionario.id)}>
                    <Trash className="text-xl" />
                  </Button>
                </div>
              </div>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar Funcionário</DialogTitle>
                </DialogHeader>
                {selectedFuncionario && (
                  <Tabs defaultValue="edit-employee">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="change-goal">Alterar Meta</TabsTrigger>
                      <TabsTrigger value="edit-employee">Editar Funcionário</TabsTrigger>
                    </TabsList>
                    <TabsContent value="change-goal">
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="salesTarget">Nova Meta de Vendas</Label>
                          <Input
                            id="salesTarget"
                            type="number"
                            placeholder={`R$ ${selectedFuncionario.salesTarget.toLocaleString('pt-BR')}`}
                            value={editSalesTarget}
                            onChange={(e) => setEditSalesTarget(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </div>
                        <div className="flex justify-end pt-4">
                          <DialogClose asChild>
                            <Button onClick={handleUpdateSalesTarget}>Salvar Meta</Button>
                          </DialogClose>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="edit-employee">
                      <div className="space-y-4 p-4">
                        <div className="space-y-2">
                          <Label>Foto</Label>
                          <div className="flex items-center gap-4">
                            <Image src={editEmployeePhoto || selectedFuncionario.avatarUrl} alt={selectedFuncionario.name} width={64} height={64} className="rounded-full" />
                            <Button variant="outline" size="sm" asChild>
                              <label htmlFor="photo-upload" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" />
                                Alterar foto
                                <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={e => handlePhotoUpload(e, setEditEmployeePhoto)} />
                              </label>
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input id="name" value={editEmployeeName} onChange={e => setEditEmployeeName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role-select">Função</Label>
                           <Combobox
                                options={roleOptions}
                                value={editEmployeeRole}
                                onChange={setEditEmployeeRole}
                                placeholder="Selecione a função"
                                searchPlaceholder="Buscar função..."
                                emptyText="Nenhuma função encontrada."
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                           <DialogClose asChild>
                            <Button onClick={handleUpdateEmployee}>Salvar Alterações</Button>
                           </DialogClose>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>
    </>
  );
}
