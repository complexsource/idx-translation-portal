"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Copy, RefreshCw } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain: '',
    translationType: 'basic',
    planType: 'unlimited',
    tokenLimit: '',
    apiKey: '',
    regenerateApiKey: false,
  });
  
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${params.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch client data');
        }
        
        const clientData = await res.json();
        setFormData({
          name: clientData.name,
          email: clientData.email || '',
          domain: clientData.domain,
          translationType: clientData.translationType,
          planType: clientData.planType || 'unlimited',
          tokenLimit: clientData.tokenLimit?.toString() || '',
          apiKey: clientData.apiKey,
          regenerateApiKey: false,
        });
      } catch (error) {
        console.error('Error fetching client:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load client data.',
        });
        router.push('/dashboard/clients');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClient();
  }, [params.id, router, toast]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTranslationTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, translationType: value }));
  };

  const handlePlanTypeChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      planType: value,
      tokenLimit: value === 'unlimited' ? '' : prev.tokenLimit 
    }));
  };
  
  const handleRegenerateApiKeyToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, regenerateApiKey: checked }));
  };
  
  const copyApiKey = () => {
    navigator.clipboard.writeText(formData.apiKey);
    toast({
      title: 'API key copied',
      description: 'The API key has been copied to your clipboard.',
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.name.trim() || !formData.email.trim() || !formData.domain.trim()) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
        });
        return;
      }

      if (formData.planType === 'limited' && !formData.tokenLimit) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please specify a token limit for limited plan.',
        });
        return;
      }
      
      // Submit to API
      const res = await fetch(`/api/clients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          domain: formData.domain,
          translationType: formData.translationType,
          planType: formData.planType,
          tokenLimit: formData.planType === 'limited' ? parseInt(formData.tokenLimit) : null,
          regenerateApiKey: formData.regenerateApiKey,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update client');
      }
      
      const data = await res.json();
      
      if (data.client && data.client.apiKey) {
        setFormData(prev => ({
          ...prev,
          apiKey: data.client.apiKey,
          regenerateApiKey: false,
        }));
      }
      
      toast({
        title: 'Client Updated',
        description: 'The client has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update client. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/dashboard/clients">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Client</h1>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading client data...</p>
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Edit Client</CardTitle>
              <CardDescription>
                Update client information and settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex">
                  <Input
                    id="apiKey"
                    value={formData.apiKey}
                    readOnly
                    className="font-mono text-sm flex-1 bg-muted"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyApiKey}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy API Key</span>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="regenerateApiKey"
                    checked={formData.regenerateApiKey}
                    onCheckedChange={handleRegenerateApiKeyToggle}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="regenerateApiKey"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Regenerate API Key
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Warning: This will invalidate the existing API key.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select 
                  value={formData.planType} 
                  onValueChange={handlePlanTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.planType === 'limited' && (
                <div className="space-y-2">
                  <Label htmlFor="tokenLimit">Token Limit</Label>
                  <Input
                    id="tokenLimit"
                    name="tokenLimit"
                    type="number"
                    placeholder="Enter token limit"
                    value={formData.tokenLimit}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of tokens the client can use.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <Label htmlFor="translationType">Translation Type</Label>
                <RadioGroup
                  value={formData.translationType}
                  onValueChange={handleTranslationTypeChange}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="basic" id="basic" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="basic" className="font-medium cursor-pointer">Basic</Label>
                      <p className="text-sm text-muted-foreground">
                        Standard translation capabilities.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="advanced" className="font-medium cursor-pointer">Advanced</Label>
                      <p className="text-sm text-muted-foreground">
                        Enhanced translation with better context handling.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="expert" id="expert" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="expert" className="font-medium cursor-pointer">Expert</Label>
                      <p className="text-sm text-muted-foreground">
                        Premium translation with highest quality and customization.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" type="button" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    Delete Client
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Client</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this client? This action cannot be undone and will also delete all associated usage data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        fetch(`/api/clients/${params.id}`, {
                          method: 'DELETE',
                        }).then(res => {
                          if (res.ok) {
                            toast({
                              title: 'Client deleted',
                              description: 'Client has been successfully deleted.',
                            });
                            router.push('/dashboard/clients');
                          } else {
                            throw new Error('Failed to delete client');
                          }
                        }).catch(error => {
                          console.error('Error deleting client:', error);
                          toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Failed to delete client.',
                          });
                        });
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}