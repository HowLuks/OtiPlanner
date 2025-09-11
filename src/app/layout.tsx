'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { DataProvider, useData } from '@/contexts/data-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loading = authLoading || (user && dataLoading);

  useEffect(() => {
    if (!isClient) return;

    const isAuthPage = pathname === '/login';
    
    if (authLoading) {
      return;
    }

    if (!user && !isAuthPage) {
      router.push('/login');
    }

    if (user && isAuthPage) {
      router.push('/dashboard');
    }

  }, [user, authLoading, router, pathname, isClient]);

  if (loading || !isClient) {
    return (
      <div className="flex flex-col h-screen">
        <header className="p-4 border-b flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="flex-1 p-8">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  // Allow access to login page if not authenticated
  if (!user && pathname === '/login') {
    return (
        <>
          {children}
          <Toaster />
        </>
    )
  }

  // If user is not logged in and not on login page, we show a loader while redirecting
  if (!user) {
     return (
       <div className="flex flex-col h-screen">
         <header className="p-4 border-b flex items-center justify-between">
           <Skeleton className="h-8 w-48" />
           <div className="flex items-center gap-4">
             <Skeleton className="h-10 w-10 rounded-full" />
           </div>
         </header>
         <main className="flex-1 p-8">
           <Skeleton className="h-full w-full" />
         </main>
       </div>
    );
  }


  return (
    <>
      {children}
      <Toaster />
    </>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 48 48' fill='none'><path d='M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z' fill='%23098c92'></path></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500;700&family=Spline+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <DataProvider>
            <AppContent>{children}</AppContent>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
