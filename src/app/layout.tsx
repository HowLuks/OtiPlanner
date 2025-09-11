'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const isAuthPage = pathname === '/login';
    
    // If loading, don't do anything yet.
    if (loading) {
      return;
    }

    // If not logged in and not on the login page, redirect to login.
    if (!user && !isAuthPage) {
      router.push('/login');
    }

    // If logged in and on the login page, redirect to dashboard.
    if (user && isAuthPage) {
      router.push('/dashboard');
    }

  }, [user, loading, router, pathname, isClient]);

  if (loading || !isClient) {
    return (
      <html lang="pt-BR" className="dark">
        <body>
          <div className="flex flex-col h-screen">
            <header className="p-4 border-b">
              <Skeleton className="h-8 w-48" />
            </header>
            <main className="flex-1 p-8">
              <Skeleton className="h-full w-full" />
            </main>
          </div>
        </body>
      </html>
    );
  }

  // Allow access to login page if not authenticated
  if (!user && pathname === '/login') {
    return (
       <html lang="pt-BR" className="dark">
        <body className="font-body antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    )
  }

  // If user is not logged in and not on login page, we show a loader while redirecting
  if (!user) {
     return (
      <html lang="pt-BR" className="dark">
        <body>
          <div className="flex flex-col h-screen">
            <header className="p-4 border-b">
              <Skeleton className="h-8 w-48" />
            </header>
            <main className="flex-1 p-8">
              <Skeleton className="h-full w-full" />
            </main>
          </div>
        </body>
      </html>
    );
  }


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
        {children}
        <Toaster />
      </body>
    </html>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DataProvider>
        <AppLayout>{children}</AppLayout>
      </DataProvider>
    </AuthProvider>
  );
}
