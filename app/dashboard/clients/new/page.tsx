"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain: '',
    translationType: 'basic',
    planType: 'unlimited',
    tokenLimit: '',
    aiModel: 'gpt-4o-mini',
    idxAiType: 'Prompt AI',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      toast({
        title: 'Client Created',
        description: 'The client has been successfully created.',
      });

      router.push('/dashboard/clients');
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create client. Please try again.',
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
        <h1 className="text-3xl font-bold">Add New Client</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Create a new client for translation services. An API key will be automatically generated.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Acme Corporation"
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
                placeholder="contact@acme.com"
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
                placeholder="acme.com"
                value={formData.domain}
                onChange={handleChange}
                required
              />
            </div>

            {/* Plan Type */}
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
              </div>
            )}

            {/* AI Model Selection */}
            <div className="space-y-2">
              <Label>Select AI Model</Label>
              <Select
                value={formData.aiModel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, aiModel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IDX AI Type */}
            <div className="space-y-2">
              <Label>Select IDX AI Type</Label>
              <Select
                value={formData.idxAiType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, idxAiType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select IDX AI Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prompt AI">Prompt AI</SelectItem>
                  <SelectItem value="Translate AI">Translate AI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Translation Type (conditional) */}
            {formData.idxAiType === 'Translate AI' && (
              <div className="space-y-4">
                <Label htmlFor="translationType">Translation Type</Label>
                <RadioGroup
                  value={formData.translationType}
                  onValueChange={handleTranslationTypeChange}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="basic" id="basic" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="basic" className="font-medium cursor-pointer">Basic</Label>
                      <p className="text-sm text-muted-foreground">Standard translation capabilities.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="advanced" className="font-medium cursor-pointer">Advanced</Label>
                      <p className="text-sm text-muted-foreground">Better context handling.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="expert" id="expert" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="expert" className="font-medium cursor-pointer">Expert</Label>
                      <p className="text-sm text-muted-foreground">Highest quality and customization.</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard/clients">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Creating Client...
                </>
              ) : (
                'Create Client'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}