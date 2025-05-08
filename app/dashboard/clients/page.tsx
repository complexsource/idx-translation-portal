"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  CirclePlus,
  Copy,
  EyeIcon,
  Mail,
  Pencil,
  Search,
  Trash2,
  Users,
  List,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ClientsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
          setFilteredClients(data);
        } else {
          throw new Error('Failed to fetch clients');
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load client data.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, [toast]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(
        client =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: 'API key copied',
      description: 'The API key has been copied to your clipboard.',
    });
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setClients(prev => prev.filter(client => client._id !== id));
        toast({
          title: 'Client deleted',
          description: 'Client has been successfully deleted.',
        });
      } else {
        throw new Error('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete client.',
      });
    }
  };

  const getTranslationTypeColor = (type: string) => {
    switch (type) {
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'expert':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isTokenLimitExceeded = (client: any) => {
    if (client.planType === 'limited' && client.tokenLimit) {
      return (client.usage?.tokens || 0) >= client.tokenLimit;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-[50px] md:mt-[10px]">
        <h1 className="text-3xl font-bold">Clients</h1>
        <div className="flex items-center gap-3">
          <Button
            variant={viewType === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewType('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewType('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          {user?.role === 'admin' && (
            <Button asChild>
              <Link href="/dashboard/clients/new">
                <CirclePlus className="mr-2 h-4 w-4" />
                Add New Client
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      ) : (
        <div className={viewType === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-4'}>
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <Card key={client._id} className={`flex flex-col justify-between h-full overflow-hidden ${isTokenLimitExceeded(client) ? 'border-red-500 dark:border-red-700' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{client.name}</CardTitle>
                      <CardDescription className="mt-1">{client.domain}</CardDescription>
                    </div>
                    <Badge className={getTranslationTypeColor(client.translationType || client.idxAiType)}>
                      {(client.translationType
                        ? client.idxAiType + ": " + client.translationType.charAt(0).toUpperCase() + client.translationType.slice(1)
                        : client.idxAiType)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">API Key</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyApiKey(client.apiKey)}
                        title="Copy API Key"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="bg-muted p-2 rounded-none overflow-hidden">
                      <p className="text-xs font-mono truncate">{client.apiKey}</p>
                    </div>
                  </div>
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan Type:</span>
                      <span className="font-medium capitalize">{client.planType || 'unlimited'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Token Limit:</span>
                      <span className="font-medium">
                        {client.planType === 'limited' ? client.tokenLimit?.toLocaleString() : '♾️'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tokens Used:</span>
                      <span className={`font-medium ${isTokenLimitExceeded(client) ? 'text-red-600 dark:text-red-400' : ''}`}>
                        {(client.usage?.tokens || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-medium">${(client.usage?.cost || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="font-medium">
                        {client.usage?.lastUsed ? new Date(client.usage.lastUsed).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Type:</span>
                      <span className="font-medium">{client.idxAiType}</span>
                    </div>
                    {client.aiModel && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">AI Model:</span>
                        <span className="font-medium">{client.aiModel}</span>
                      </div>
                    )}
                  </div>

                  {isTokenLimitExceeded(client) && (
                    <div className="mt-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-none text-sm">
                      Token limit exceeded! Please upgrade the plan.
                    </div>
                  )}
                </CardContent>
                <div className="mt-auto flex items-center justify-between p-4 pt-5 border-t">
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <Link href={`/dashboard/usage?clientId=${client._id}`}>
                      <EyeIcon className="mr-1 h-3 w-3" />
                      View Usage
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2">
                    {user?.role === 'admin' && (
                      <>
                        <Button variant="outline" size="icon" asChild className="h-8 w-8">
                          <Link href={`/dashboard/clients/${client._id}`}>
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Client</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <span className="font-semibold">{client.name}</span>? This action cannot be undone and will also delete all associated usage data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteClient(client._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-96">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No clients found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'No clients match your search criteria.' : 'There are no clients in the system yet.'}
              </p>
              {user?.role === 'admin' && (
                <Button asChild>
                  <Link href="/dashboard/clients/new">
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Add New Client
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}