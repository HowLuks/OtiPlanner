'use client'

import { useState } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from "@/contexts/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction } from "@/lib/data";
import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";


function TransactionDialog({ 
    transaction, 
    onSave,
    children 
} : {
    transaction: Partial<Transaction> | null,
    onSave: (transaction: Omit<Transaction, 'id'>) => void,
    children: React.ReactNode
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'Entrada' | 'Saída'>('Entrada');
    const [value, setValue] = useState('');

    const handleOpen = () => {
        setDate(transaction?.date || new Date().toISOString().split('T')[0]);
        setDescription(transaction?.description || '');
        setType(transaction?.type || 'Entrada');
        const numericValue = transaction?.value ? transaction.value.replace(/[^0-9,.]/g, '').replace('.', '').replace(',', '.') : '';
        setValue(numericValue);
        setIsOpen(true);
    }
    
    const handleSave = () => {
        const formattedValue = parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        onSave({
            date,
            description,
            type,
            value: formattedValue,
            isIncome: type === 'Entrada'
        });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild onClick={handleOpen}>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{transaction?.id ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="value">Valor (R$)</Label>
                        <Input id="value" type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                         <Select value={type} onValueChange={(v: 'Entrada' | 'Saída') => setType(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Entrada">Entrada</SelectItem>
                                <SelectItem value="Saída">Saída</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave}>Salvar</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function FinanceiroPage() {
    const { transactions, loading } = useData();
    const { toast } = useToast();

    const handleSaveTransaction = async (transactionData: Omit<Transaction, 'id'>, id?: string) => {
        const transactionId = id || `trans-${Date.now()}`;
        try {
            await setDoc(doc(db, 'transactions', transactionId), transactionData, { merge: true });
            toast({
                title: 'Sucesso!',
                description: `Transação ${id ? 'atualizada' : 'criada'} com sucesso.`
            });
        } catch(error) {
            console.error("Erro ao salvar transação: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível salvar a transação.'
            });
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if(window.confirm('Tem certeza que deseja deletar esta transação?')) {
            try {
                await deleteDoc(doc(db, 'transactions', id));
                toast({
                    title: 'Sucesso!',
                    description: 'Transação deletada com sucesso.'
                });
            } catch(error) {
                console.error("Erro ao deletar transação: ", error);
                 toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: 'Não foi possível deletar a transação.'
                });
            }
        }
    };

    const { totalIncome, totalOutcome } = transactions.reduce((acc, transaction) => {
        const value = parseFloat(transaction.value.replace('R$', '').replace('.', '').replace(',', '.'));
        if (transaction.isIncome) {
            acc.totalIncome += value;
        } else {
            acc.totalOutcome += value;
        }
        return acc;
    }, { totalIncome: 0, totalOutcome: 0 });

    if (loading) {
        return (
             <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <Skeleton className="h-12 w-64" />
                        <Skeleton className="h-12 w-40" />
                    </div>
                    <div className="mb-8">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                        </div>
                    </div>
                    <div className="mb-8">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Financeiro</h1>
                    </div>
                    <TransactionDialog transaction={null} onSave={(data) => handleSaveTransaction(data)}>
                        <Button className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
                            <Plus className="mr-2" />
                            <span className="truncate">Nova Transação</span>
                        </Button>
                    </TransactionDialog>
                </div>
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Resumo</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex flex-col gap-2 rounded-xl bg-card p-6">
                            <p className="text-muted-foreground">Entradas</p>
                            <p className="text-3xl font-bold text-green-500">{totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl bg-card p-6">
                            <p className="text-muted-foreground">Saídas</p>
                            <p className="text-3xl font-bold text-red-500">{totalOutcome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </div>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Transações Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-medium text-muted-foreground">{transaction.date}</TableCell>
                                        <TableCell className="text-muted-foreground">{transaction.description}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${transaction.isIncome ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{transaction.type}</span>
                                        </TableCell>
                                        <TableCell className={`font-medium ${transaction.isIncome ? 'text-green-500' : 'text-red-500'}`}>{transaction.value}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <TransactionDialog transaction={transaction} onSave={(data) => handleSaveTransaction(data, transaction.id)}>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </TransactionDialog>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(transaction.id)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
