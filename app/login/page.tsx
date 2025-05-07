"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: 'Login successful!',
          description: 'Redirecting to dashboard...',
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: 'Invalid email or password. Please try again.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Image src="/images/logo/idx-logo.png" alt="IDX Logo" width={100} height={24} className="w-[100px]" />
        </Link>
      </div>
      <main className="min-h-[calc(100vh-117px)] flex items-center justify-center bg-muted px-4">
  <div className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md shadow-lg p-6 border border-white/20">
    <CardHeader className="space-y-1 text-center">
      <CardTitle className="text-3xl font-extrabold text-white">Welcome Back</CardTitle>
      <CardDescription className="text-sm text-white/70">
        Sign in to your IDX dashboard
      </CardDescription>
    </CardHeader>
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@idx.inc"
            required
            className="bg-white/20 text-white placeholder-white/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white">Password</Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              className="bg-white/20 text-white placeholder-white/60"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-white/70" />
              ) : (
                <Eye className="h-4 w-4 text-white/70" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-white text-black hover:bg-gray-100 font-semibold transition-all"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Logging in...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </div>
          )}
        </Button>
      </CardFooter>
    </form>
  </div>
      </main>
      <footer className="border-t py-4">
        <div className="mx-auto container flex flex-col items-center gap-2 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-sm text-muted-foreground">
            © 2025 IDX Translation Portal
          </p>
        </div>
      </footer>
    </div>
  );
}