"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Image from 'next/image';
import {
  BarChart3,
  CircleArrowRight,
  CreditCard,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth(); // add isLoading
  const [open, setOpen] = useState(false);

  if (isLoading) return null; // or show a loader

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isViewer = user?.role === 'viewer';

  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      active: pathname === '/dashboard',
    },
    {
      label: isClient ? 'Client Info' : 'Clients',
      icon: Database,
      href: '/dashboard/clients',
      active: pathname === '/dashboard/clients' || pathname.startsWith('/dashboard/clients/'),
    },    
    ...(isClient ? [] : [
      {
        label: 'Usage',
        icon: BarChart3,
        href: '/dashboard/usage',
        active: pathname === '/dashboard/usage' || pathname.startsWith('/dashboard/usage/'),
      },
      {
        label: 'API Reference',
        icon: CreditCard,
        href: '/dashboard/api-reference',
        active: pathname === '/dashboard/api-reference',
      }
    ]),
    ...(isAdmin ? [
      {
        label: 'Users',
        icon: Users,
        href: '/dashboard/users',
        active: pathname === '/dashboard/users' || pathname.startsWith('/dashboard/users/'),
      },
      {
        label: 'Settings',
        icon: Settings,
        href: '/dashboard/settings',
        active: pathname === '/dashboard/settings',
      },
    ] : []),
  ];
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden absolute left-4 top-3 z-40"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <MobileSidebar
            routes={routes}
            setOpen={setOpen}
            handleLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>
      
      <aside 
        className={cn(
          "fixed left-0 hidden h-screen w-64 flex-col border-r bg-background px-4 py-8 md:flex",
          className
        )}
      >
        <div className="flex items-center gap-2 px-4 py-2 mb-8">
          <Image src="/images/logo/idx-logo.png" alt="IDX Logo" width={100} height={24} className="w-[100px]" />
        </div>
        <ScrollArea className="flex-1">
          <nav className="grid gap-2 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-none px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                  route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>
        <div className="mt-auto grid gap-2 px-2">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1 max-w-[200px]">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}

function MobileSidebar({ 
  routes, 
  setOpen, 
  handleLogout 
}: { 
  routes: any[];
  setOpen: (open: boolean) => void;
  handleLogout: () => void;
}) {
  const { user } = useAuth();
  
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-7 py-4">
        <Image src="/images/logo/idx-logo.png" alt="IDX Logo" width={100} height={24} className="w-[100px]" />
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid gap-2 p-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-none px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex items-center justify-between p-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}