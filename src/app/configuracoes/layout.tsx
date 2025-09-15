import { AppHeader } from "@/components/header";

export default function ConfiguracoesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden bg-background">
      <AppHeader />
      {children}
    </div>
  );
}
