'use client'

import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/icons";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/servicos", label: "Serviços" },
  { href: "/funcionarios", label: "Funcionários" },
  { href: "/", label: "Agendamentos" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/configuracoes", label: "Configurações" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Você saiu!",
        description: "Você foi desconectado com sucesso.",
      });
      router.push('/login');
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível fazer o logout. Tente novamente.",
      });
    }
  };


  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border px-6 lg:px-10 py-4">
      <div className="flex items-center gap-4">
        <Logo className="text-primary h-6 w-6" />
        <h1 className="text-xl font-bold font-headline">OtiPlanner</h1>
      </div>
      <nav className="hidden lg:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-white ${
              pathname === link.href ? "text-white" : "text-gray-300"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <Button onClick={handleSignOut} variant="ghost" size="icon" className="hidden lg:flex">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sair</span>
        </Button>
        <div className="lg:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Abrir menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-card border-r border-border p-6 flex flex-col">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <nav className="flex flex-col gap-6 mt-8 flex-1">
                        {navLinks.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className={`text-lg font-medium transition-colors hover:text-white ${
                              pathname === link.href ? "text-white" : "text-gray-300"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                    </nav>
                     <Button onClick={handleSignOut} variant="outline" className="w-full">
                      <LogOut className="mr-2 h-5 w-5" />
                      Sair
                    </Button>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
