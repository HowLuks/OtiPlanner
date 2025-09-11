'use client'

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const navLinks = [
  { href: "#", label: "Dashboard" },
  { href: "#", label: "Clientes" },
  { href: "#", label: "Serviços" },
  { href: "#", label: "Funcionários" },
  { href: "#", label: "Agendamentos", active: true },
  { href: "#", label: "Financeiro" },
];

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

export function AppHeader() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border px-6 lg:px-10 py-4">
      <div className="flex items-center gap-4">
        <Logo className="text-primary h-6 w-6" />
        <h1 className="text-xl font-bold font-headline">Agendamento</h1>
      </div>
      <nav className="hidden lg:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`text-sm font-medium transition-colors hover:text-white ${
              link.active ? "text-white" : "text-gray-300"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Abrir menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-[#122118] border-r border-border p-6">
                    <nav className="flex flex-col gap-6 mt-8">
                        {navLinks.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className={`text-lg font-medium transition-colors hover:text-white ${
                              link.active ? "text-white" : "text-gray-300"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>

        <Avatar className="h-10 w-10">
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" data-ai-hint={userAvatar.imageHint || 'profile person'} />}
            <AvatarFallback>AV</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
