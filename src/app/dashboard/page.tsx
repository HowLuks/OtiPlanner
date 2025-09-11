'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DonutChart, DonutChartCell } from "@/components/donut-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, TrendingUp, Users } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/contexts/data-context";

export default function DashboardPage() {
    const { funcionarios, roles, saldoEmCaixa, loading } = useData();

    const getRoleName = (roleId: string) => {
        if (!roles) return 'Carregando...';
        return roles.find(role => role.id === roleId)?.name || 'N/A';
    }

    if (loading) {
        return (
          <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <Skeleton className="h-9 w-64" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <div>
              <Skeleton className="h-8 w-96 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
              </div>
            </div>
          </main>
        );
    }
    
    const totalSalesValue = funcionarios.reduce((acc, func) => acc + func.salesValue, 0);
    const totalSalesTarget = funcionarios.reduce((acc, func) => acc + func.salesTarget, 0);
    const totalSalesProgress = totalSalesTarget > 0 ? (totalSalesValue / totalSalesTarget) * 100 : 0;

  return (
    <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {saldoEmCaixa.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">+15% em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Total de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
                R$ {totalSalesValue.toLocaleString('pt-BR')} de R$ {totalSalesTarget.toLocaleString('pt-BR')}
            </p>
            <Progress value={totalSalesProgress} className="mt-2 h-3" />
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionarios.length}</div>
            <p className="text-xs text-muted-foreground">Funcionários ativos na plataforma</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-4">Progresso Individual dos Funcionários</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {funcionarios.map((funcionario) => {
            const chartData: DonutChartCell[] = [
              { name: "Completo", value: funcionario.salesValue, color: "hsl(var(--primary))" },
              { name: "Restante", value: Math.max(0, funcionario.salesTarget - funcionario.salesValue), color: "hsl(var(--muted))" },
            ];
            const roleName = getRoleName(funcionario.roleId);

            return (
              <Card key={funcionario.id} className="flex flex-col items-center justify-center p-6 text-center">
                <div className="relative size-40">
                  <DonutChart data={chartData} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-primary">{funcionario.salesGoal}%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Avatar className="mx-auto mb-2 h-16 w-16">
                     <Image
                        alt={funcionario.name}
                        className="rounded-full object-cover"
                        src={funcionario.avatarUrl}
                        width={64}
                        height={64}
                        data-ai-hint={funcionario.avatarHint}
                    />
                    <AvatarFallback>{funcionario.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <h4 className="text-lg font-semibold">{funcionario.name}</h4>
                  <p className="text-sm text-muted-foreground">{roleName}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  R$ {funcionario.salesValue.toLocaleString('pt-BR')} / R$ {funcionario.salesTarget.toLocaleString('pt-BR')}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
