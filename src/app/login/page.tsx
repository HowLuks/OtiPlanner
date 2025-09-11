'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Logo } from '@/components/icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthError = (error: AuthError) => {
    console.error(error.code, error.message);
    let description = 'Ocorreu um erro inesperado.';
    switch (error.code) {
      case 'auth/invalid-email':
        description = 'O endereço de e-mail não é válido.';
        break;
      case 'auth/user-disabled':
        description = 'Este usuário foi desativado.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        description = 'E-mail ou senha incorretos.';
        break;
      case 'auth/email-already-in-use':
        description = 'Este e-mail já está em uso por outra conta.';
        break;
      case 'auth/weak-password':
        description = 'A senha é muito fraca. Tente uma mais forte.';
        break;
       default:
         description = `Erro: ${error.message}`;
    }
     toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description,
      });
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Sucesso!',
        description: 'Conta criada. Redirecionando para o dashboard...',
      });
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
       toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o dashboard...',
      });
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
            <div className="flex justify-center mb-6">
                <Logo className="h-10 w-10 text-primary" />
            </div>
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                <Card>
                    <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Acesse sua conta para gerenciar seus agendamentos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button className="w-full" onClick={handleSignIn} disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    </CardFooter>
                </Card>
                </TabsContent>
                <TabsContent value="signup">
                <Card>
                    <CardHeader>
                    <CardTitle>Criar Conta</CardTitle>
                    <CardDescription>Crie uma nova conta para começar a usar o OtiPlanner.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button className="w-full" onClick={handleSignUp} disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Conta'}
                    </Button>
                    </CardFooter>
                </Card>
                </TabsContent>
            </Tabs>
        </div>
    </div>
  );
}
