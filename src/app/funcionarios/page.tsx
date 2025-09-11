'use client';

import { useState, useEffect } from 'react';
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
import { Funcionario, Role } from "@/lib/data";
import { Combobox } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';

interface FuncionarioCardProps {
  funcionario: Funcionario;
  roleName: string;
  roleOptions: { label: string; value: string }[];
  onUpdate: (updatedFuncionario: Funcionario) => void;
  onDelete: (id: string) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
}

function FuncionarioCard({ funcionario, roleName, roleOptions, onUpdate, onDelete, onPhotoUpload }: FuncionarioCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editEmployeeName, setEditEmployeeName] = useState(funcionario.name);
  const [editEmployeeRoleId, setEditEmployeeRoleId] = useState(funcionario.roleId);
  const [editEmployeePhoto, setEditEmployeePhoto] = useState<string | null>(funcionario.avatarUrl);
  const [editSalesTarget, setEditSalesTarget] = useState<number | ''>(funcionario.salesTarget);
  
  const handleOpen = () => {
    setEditEmployeeName(funcionario.name);
    setEditEmployeeRoleId(funcionario.roleId);
    setEditEmployeePhoto(funcionario.avatarUrl);
    setEditSalesTarget(funcionario.salesTarget);
    setIsOpen(true);
  };

  const handleUpdateEmployee = () => {
    const updatedFuncionario = {
      ...funcionario,
      name: editEmployeeName.trim(),
      roleId: editEmployeeRoleId,
      avatarUrl: editEmployeePhoto || funcionario.avatarUrl,
    };
    onUpdate(updatedFuncionario);
    setIsOpen(false);
  };
  
  const handleUpdateSalesTarget = () => {
    const newSalesTarget = Number(editSalesTarget) || 0;
    const updatedFuncionario = {
        ...funcionario,
        salesTarget: newSalesTarget,
        salesGoal: newSalesTarget > 0 ? Math.round((funcionario.salesValue / newSalesTarget) * 100) : 0,
    };
    onUpdate(updatedFuncionario);
    setIsOpen(false);
  };

  return (
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
      <p className="text-sm text-muted-foreground">{roleName}</p>
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-primary" onClick={handleOpen}>
              <Edit className="text-xl" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Funcionário</DialogTitle>
            </DialogHeader>
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
                      placeholder={`R$ ${funcionario.salesTarget.toLocaleString('pt-BR')}`}
                      value={editSalesTarget}
                      onChange={(e) => setEditSalesTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleUpdateSalesTarget}>Salvar Meta</Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="edit-employee">
                <div className="space-y-4 p-4">
                  <div className="space-y-2">
                    <Label>Foto</Label>
                    <div className="flex items-center gap-4">
                      {editEmployeePhoto && <Image src={editEmployeePhoto} alt={funcionario.name} width={64} height={64} className="rounded-full" />}
                      <Button variant="outline" size="sm" asChild>
                        <label htmlFor="photo-upload" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Alterar foto
                          <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={e => onPhotoUpload(e, setEditEmployeePhoto)} />
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
                      value={editEmployeeRoleId}
                      onChange={setEditEmployeeRoleId}
                      placeholder="Selecione a função"
                      searchPlaceholder="Buscar função..."
                      emptyText="Nenhuma função encontrada."
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleUpdateEmployee}>Salvar Alterações</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-destructive" onClick={() => onDelete(funcionario.id)}>
          <Trash className="text-xl" />
        </Button>
      </div>
    </div>
  )
}

export default function FuncionariosPage() {
  const { user, loading: authLoading } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Funcionario[] | null>(null);
  const [roles, setRoles] = useState<Role[] | null>(null);

  const [newEmployeeRoleId, setNewEmployeeRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeePhoto, setNewEmployeePhoto] = useState<string | null>(null);
  const [newEmployeeSalesTarget, setNewEmployeeSalesTarget] = useState<number | ''>(2000);

   useEffect(() => {
    if (!authLoading && user) {
        const unsubFunc = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
            setFuncionarios(snapshot.docs.map(doc => doc.data() as Funcionario));
        });

        const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
            setRoles(snapshot.docs.map(doc => doc.data() as Role));
        });
        
        return () => {
            unsubFunc();
            unsubRoles();
        };
    }
  }, [user, authLoading]);

  const isLoading = authLoading || !roles || !funcionarios;

  if (isLoading) {
      return (
        <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                <Skeleton className="h-9 w-64" />
                <div className="flex gap-2 mt-4 md:mt-0">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
            </div>
        </main>
      )
  }

  const roleOptions = roles.map(role => ({ value: role.id, label: role.name }));

  const getRoleName = (roleId: string) => {
    return roles.find(role => role.id === roleId)?.name || 'Função não encontrada';
  }

  const handleAddNewRole = async () => {
    if (newRoleName.trim() !== '' && !roles.find(r => r.name.toLowerCase() === newRoleName.toLowerCase())) {
        const newRoleId = `role-${roles.length + 1 + Date.now()}`;
        const newRole: Role = {
            id: newRoleId,
            name: newRoleName.trim(),
        };
      await setDoc(doc(db, 'roles', newRoleId), newRole);
      setNewRoleName('');
    }
  };

  const handleAddNewEmployee = async () => {
    if (newEmployeeName.trim() && newEmployeeRoleId && funcionarios) {
      const newEmployeeId = `func-${funcionarios.length + 1 + Date.now()}`;
      const newEmployee: Funcionario = {
        id: newEmployeeId,
        name: newEmployeeName.trim(),
        roleId: newEmployeeRoleId,
        avatarUrl: newEmployeePhoto || `https://picsum.photos/seed/${newEmployeeId}/112/112`,
        avatarHint: 'person portrait',
        salesGoal: 0,
        salesValue: 0,
        salesTarget: Number(newEmployeeSalesTarget) || 2000,
      };
      await setDoc(doc(db, 'funcionarios', newEmployeeId), newEmployee);
      setNewEmployeeName('');
      setNewEmployeeRoleId('');
      setNewEmployeePhoto(null);
      setNewEmployeeSalesTarget(2000);
    }
  };

  const handleUpdateFuncionario = async (updatedFuncionario: Funcionario) => {
    const funcDocRef = doc(db, "funcionarios", updatedFuncionario.id);
    await setDoc(funcDocRef, updatedFuncionario, { merge: true });
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteDoc(doc(db, "funcionarios", id));
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
                        value={newEmployeeRoleId}
                        onChange={setNewEmployeeRoleId}
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
            <FuncionarioCard 
              key={funcionario.id}
              funcionario={funcionario}
              roleName={getRoleName(funcionario.roleId)}
              roleOptions={roleOptions}
              onUpdate={handleUpdateFuncionario}
              onDelete={handleDeleteEmployee}
              onPhotoUpload={handlePhotoUpload}
            />
          ))}
        </div>
      </main>
    </>
  );
}
