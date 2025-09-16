'use client'

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from "@/contexts/data-context";


export default function FinanceiroPage() {
    const { transactions, loading } = useData();

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
                    <Button className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-105">
                        <Plus className="mr-2" />
                        <span className="truncate">Nova Transação</span>
                    </Button>
                </div>
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Resumo Mensal</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="flex flex-col gap-2 rounded-xl bg-card p-6">
                            <p className="text-muted-foreground">Entradas</p>
                            <p className="text-3xl font-bold text-foreground">R$ 12.500,00</p>
                            <p className="text-green-400 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-base"> trending_up </span>
                                <span>+15%</span>
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl bg-card p-6">
                            <p className="text-muted-foreground">Saídas</p>
                            <p className="text-3xl font-bold text-foreground">R$ 7.800,00</p>
                            <p className="text-red-500 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-base"> trending_down </span>
                                <span>-8%</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Transações</h3>
                    <div className="overflow-x-auto rounded-xl border border-border bg-card">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-secondary/30">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Tipo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transactions.map((transaction, index) => (
                                    <tr key={index}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{transaction.date}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{transaction.description}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${transaction.isIncome ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{transaction.type}</span>
                                        </td>
                                        <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${transaction.isIncome ? 'text-green-500' : 'text-red-500'}`}>{transaction.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
