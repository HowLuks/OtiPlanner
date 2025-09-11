import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { staff, Staff } from "@/lib/data";
import Image from "next/image";
import { Edit, Trash, Plus, CheckCircle, XCircle } from "lucide-react";

export default function FuncionariosPage() {
  const funcionarios = [
    {
      id: "1",
      name: "Mariana Silva",
      role: "Cabeleireira",
      avatarUrl: "https://picsum.photos/seed/5/112/112",
      avatarHint: "woman portrait",
      salesGoal: 75,
      salesValue: 3750,
      salesTarget: 5000,
      online: true,
    },
    {
      id: "2",
      name: "Lucas Oliveira",
      role: "Barbeiro",
      avatarUrl: "https://picsum.photos/seed/6/112/112",
      avatarHint: "man portrait",
      salesGoal: 50,
      salesValue: 2000,
      salesTarget: 4000,
      online: true,
    },
    {
      id: "3",
      name: "Juliana Santos",
      role: "Manicure",
      avatarUrl: "https://picsum.photos/seed/7/112/112",
      avatarHint: "woman portrait",
      salesGoal: 90,
      salesValue: 5400,
      salesTarget: 6000,
      online: true,
    },
    {
      id: "4",
      name: "Ricardo Almeida",
      role: "Recepcionista",
      avatarUrl: "https://picsum.photos/seed/8/112/112",
      avatarHint: "man portrait",
      salesGoal: 60,
      salesValue: 2100,
      salesTarget: 3500,
      online: false,
    },
    {
      id: "5",
      name: "Camila Pereira",
      role: "Esteticista",
      avatarUrl: "https://picsum.photos/seed/9/112/112",
      avatarHint: "woman portrait",
      salesGoal: 80,
      salesValue: 3600,
      salesTarget: 4500,
      online: true,
    },
  ];

  return (
    <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Funcionários</h2>
          <p className="text-muted-foreground mt-1">Adicione, edite e gerencie os funcionários do seu estabelecimento.</p>
        </div>
        <Button className="mt-4 md:mt-0">
          <Plus className="mr-2" />
          Novo Funcionário
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {funcionarios.map((funcionario) => (
          <div key={funcionario.id} className="bg-card rounded-xl p-5 flex flex-col items-center text-center transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
            <div className="relative mb-4">
              <Image
                alt={funcionario.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-background group-hover:ring-primary transition-all"
                src={funcionario.avatarUrl}
                width={112}
                height={112}
                data-ai-hint={funcionario.avatarHint}
              />
              {funcionario.online ? (
                <CheckCircle className="absolute bottom-1 right-1 block h-5 w-5 rounded-full bg-green-500 text-background border-2 border-card" />
              ) : (
                <XCircle className="absolute bottom-1 right-1 block h-5 w-5 rounded-full bg-red-500 text-background border-2 border-card" />
              )}
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
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-primary">
                <Edit className="text-xl" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent hover:text-destructive">
                <Trash className="text-xl" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
