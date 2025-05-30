"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { User, Client, UserFormData, UserRole } from '@/lib';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { EyeIcon, CirclePlus, PencilIcon, ShieldAlert, Trash2, UserCog, Users, Building2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    clientId: ''
  });  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load user data.' });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };

    fetchUsers();
    fetchClients();
  }, [toast]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleClientChange = (value: string) => {
    setFormData(prev => ({ ...prev, clientId: value }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole,
      clientId: ''
    }));
  };  
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    if (!formData.name || !formData.email || !formData.password) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'All fields are required.' });
      setIsSubmitting(false);
      return;
    }
  
    if (formData.role === 'client' && !formData.clientId) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Client is required.' });
      setIsSubmitting(false);
      return;
    }
  
    const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';
  
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
  
      if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  
      const updatedUsers = await fetch('/api/users');
      if (updatedUsers.ok) setUsers(await updatedUsers.json());
  
      toast({ title: editingUser ? 'User Updated' : 'User Created' });
  
      setFormData({ name: '', email: '', password: '', role: 'viewer', clientId: '' });
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsSubmitting(false);
    }
  };  
  
  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (res.ok) {
        setUsers(prev => prev.filter(user => user._id !== id));
        toast({
          title: 'User deleted',
          description: 'User has been successfully deleted.',
        });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user.',
      });
    }
  };
  
  return (
    <div className="space-y-6 mt-[50px] md:mt-[10px]">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CirclePlus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with appropriate role and permissions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, password: generateRandomPassword() }))}>Generate</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(prev => !prev)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <RadioGroup value={formData.role} onValueChange={handleRoleChange}>
                    <div className="flex items-start space-x-3 border p-3">
                      <RadioGroupItem value="admin" id="admin" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="admin" className="font-medium">Admin</Label>
                        <p className="text-sm text-muted-foreground">Full access to create, update, and delete all resources.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 border p-3">
                      <RadioGroupItem value="viewer" id="viewer" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="viewer" className="font-medium">Viewer</Label>
                        <p className="text-sm text-muted-foreground">Read-only access to view clients and usage data.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 border p-3">
                      <RadioGroupItem value="client" id="client" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="client" className="font-medium">Client</Label>
                        <p className="text-sm text-muted-foreground">Restricted access to their own client account data.</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                {formData.role === 'client' && (
                  <div className="grid gap-2">
                    <Label htmlFor="clientId">Assign Client</Label>
                    <Select value={formData.clientId} onValueChange={handleClientChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client._id} value={client._id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div> Creating...</>
                  ) : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', role: 'viewer', clientId: '' });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information and role.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, password: generateRandomPassword() }))}>Generate</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(prev => !prev)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <RadioGroup value={formData.role} onValueChange={handleRoleChange}>
                    <div className="flex items-start space-x-3 border p-3">
                      <RadioGroupItem value="admin" id="admin" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="admin" className="font-medium">Admin</Label>
                        <p className="text-sm text-muted-foreground">Full access to create, update, and delete all resources.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 border p-3">
                      <RadioGroupItem value="viewer" id="viewer" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="viewer" className="font-medium">Viewer</Label>
                        <p className="text-sm text-muted-foreground">Read-only access to view clients and usage data.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 border p-3">
                      <RadioGroupItem value="client" id="client" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="client" className="font-medium">Client</Label>
                        <p className="text-sm text-muted-foreground">Restricted access to their own client account data.</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                {formData.role === 'client' && (
                  <div className="grid gap-2">
                    <Label htmlFor="clientId">Assign Client</Label>
                    <Select value={formData.clientId} onValueChange={handleClientChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client._id} value={client._id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div> Updating...</>
                  ) : 'Update User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards render logic updated below */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.length > 0 ? (
            users.map((user) => (
              <Card key={user._id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{user.name}</CardTitle>
                    <Badge className="ml-auto">
                      <div className="flex items-center">
                        {user.role === 'admin' && <><ShieldAlert className="mr-1 h-3 w-3" /> Admin</>}
                        {user.role === 'viewer' && <><UserCog className="mr-1 h-3 w-3" /> Viewer</>}
                        {user.role === 'client' && <><Building2 className="mr-1 h-3 w-3" />Client: {clients.find(c => c._id === user.clientId)?.name || 'Client'}</>}
                      </div>
                    </Badge>
                  </div>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </CardContent>
                <div className="flex justify-end px-6 pb-4">
                  <AlertDialog>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => {
                          setEditingUser(user);
                          setFormData({
                            name: user.name,
                            email: user.email,
                            password: '',
                            role: user.role,
                            clientId: user.clientId || ''
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the user <span className="font-semibold">{user.name}</span>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the user <span className="font-semibold">{user.name}</span>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-96">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                There are no users in the system yet.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <CirclePlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}