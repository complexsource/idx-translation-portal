"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChevronLeft, Wallet } from 'lucide-react';

export default function UsagePage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [period, setPeriod] = useState('30days');
  
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch usage data
        let url = `/api/usage?period=${period}`;
        if (clientId) {
          url += `&clientId=${clientId}`;
        }
        
        const usageRes = await fetch(url);
        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setUsageData(usageData);
        }
        
        // If we have a clientId, fetch client details
        if (clientId) {
          const clientRes = await fetch(`/api/clients/${clientId}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClient(clientData);
          }
        }
      } catch (error) {
        console.error('Error fetching usage data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load usage data.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [clientId, period, toast]);
  
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(value);
    return `$${formatted}`;
  };
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  const getPeriodName = () => {
    switch (period) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-[50px] md:mt-[10px]">
        <div className="flex items-center">
          {clientId && (
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href="/dashboard/usage">
                <ChevronLeft className="mr-1 h-4 w-4" />
                All Usage
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-bold">
            {clientId && client ? `${client.name} Usage` : 'Overall Usage'}
          </h1>
        </div>
        
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading usage data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <CardDescription>
                  {getPeriodName()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(clientId 
                    ? (usageData?.summary?.totalTokens || 0) 
                    : (usageData?.summary?.totalTokens || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total tokens processed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <CardDescription>
                  {getPeriodName()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(clientId 
                    ? (usageData?.summary?.totalCost || 0) 
                    : (usageData?.summary?.totalCost || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cost of tokens processed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <CardDescription>
                  {getPeriodName()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(clientId 
                    ? (usageData?.summary?.count || 0) 
                    : (usageData?.summary?.totalRequests || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  API requests made
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Token Usage Over Time</CardTitle>
                <CardDescription>
                  Daily token consumption
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {usageData?.byDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={usageData.byDay.map((day: any) => ({
                        date: `${day._id.month}/${day._id.day}`,
                        tokens: day.tokens,
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                        }}
                        formatter={(value: number) => [formatNumber(value), 'Tokens']}
                      />
                      <Area
                        type="monotone"
                        dataKey="tokens"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1)/0.3)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Wallet className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="font-medium">No data available</h3>
                    <p className="text-sm text-muted-foreground">
                      No usage data for this period
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Usage by Translation Type</CardTitle>
                <CardDescription>
                  Distribution across different translation services
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {usageData?.byType?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usageData.byType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="tokens"
                        nameKey="_id"
                        label={({ _id, percent }: any) => 
                          `${_id} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {usageData.byType.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                        }}
                        formatter={(value: number, name: string) => [
                          formatNumber(value), 
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Wallet className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="font-medium">No data available</h3>
                    <p className="text-sm text-muted-foreground">
                      No usage data for this period
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {!clientId && (
            <Card>
              <CardHeader>
                <CardTitle>Top Clients by Usage</CardTitle>
                <CardDescription>
                  Clients with the highest token consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageData?.topClients?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      layout="vertical"
                      data={usageData.topClients.map((client: any) => ({
                        name: client.clientName,
                        tokens: client.totalTokens,
                        cost: client.totalCost,
                      }))}
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'tokens' ? formatNumber(value) : formatCurrency(value),
                          name === 'tokens' ? 'Tokens' : 'Cost'
                        ]}
                      />
                      <Bar 
                        dataKey="tokens" 
                        fill="hsl(var(--chart-2))" 
                        name="Tokens"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Wallet className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="font-medium">No data available</h3>
                    <p className="text-sm text-muted-foreground">
                      No client usage data for this period
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {clientId && usageData?.records?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Usage Records</CardTitle>
                <CardDescription>
                  Latest {client?.idxAiType === 'Prompt AI' ? 'prompt requests' : 'translation requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  {/* Header Row */}
                  {client?.idxAiType === 'Prompt AI' ? (
                    <div className="grid grid-cols-[260px_1fr_100px_100px] p-4 font-medium border-b">
                      <div>Date</div>
                      <div>Prompt</div>
                      <div>Tokens</div>
                      <div>Cost</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[260px_160px_1fr_100px_100px] p-4 font-medium border-b">
                      <div>Date</div>
                      <div>Type</div>
                      <div>Languages</div>
                      <div>Tokens</div>
                      <div>Cost</div>
                    </div>
                  )}

                  {/* Data Rows */}
                  <div className="divide-y">
                    {usageData.records.slice(0, 10).map((record: any) => (
                      client?.idxAiType === 'Prompt AI' ? (
                        <div key={record._id} className="grid grid-cols-[260px_1fr_100px_100px] p-4 text-sm">
                          <div>{new Date(record.timestamp).toLocaleString()}</div>
                          <div className="truncate">{record.prompt || '—'}</div>
                          <div>{formatNumber(record.tokens)}</div>
                          <div>{formatCurrency(record.cost)}</div>
                        </div>
                      ) : (
                        <div key={record._id} className="grid grid-cols-[260px_160px_1fr_100px_100px] p-4 text-sm">
                          <div>{new Date(record.timestamp).toLocaleString()}</div>
                          <div className="capitalize">{record.translationType}</div>
                          <div>{record.baseLanguage} → {record.targetLanguage}</div>
                          <div>{formatNumber(record.tokens)}</div>
                          <div>{formatCurrency(record.cost)}</div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}