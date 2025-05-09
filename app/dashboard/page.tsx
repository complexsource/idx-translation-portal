"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BarChart, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  dayjs.extend(customParseFormat);

  // console.log(recentActivity);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usageRes = await fetch('/api/usage', { cache: 'no-store' });
        if (usageRes.ok) {
          const usage = await usageRes.json();
          console.log('Usage data:', usage);
          setUsageData(usage);
          if (usage.byDay) {
            const formattedDailyData = usage.byDay.map((day: any) => ({
              date: `${day._id.day}/${day._id.month}/${day._id.year}`,
              tokens: day.tokens,
              requests: day.count,
            }));
            setRecentActivity(formattedDailyData);
          }
        }

        // Only fetch clients if admin
        if (user?.role === 'admin') {
          const clientsRes = await fetch('/api/clients', { cache: 'no-store' });
          if (clientsRes.ok) {
            const clientsData = await clientsRes.json();
            setClients(clientsData);
          }
        } else if (user?.role === 'client') {
          setClients([{ _id: user.clientId, name: user.name }]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load dashboard data.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast, user]);

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(6)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-[50px] md:mt-[10px]">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {user?.role === 'admin' && (
          <Button asChild>
            <Link href="/dashboard/clients/new">Add New Client</Link>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {user?.role === 'client' ? 'AI Service' : 'Total Clients'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                  {user?.role === 'client' ? (() => {
                    const clientData = usageData?.records?.find((r: any) => r.clientId === user.clientId);
                    if (!clientData) return 'N/A';

                    if (clientData.idxAiType === 'Translate AI') {
                      const type = clientData.translationType;
                      return `${clientData.idxAiType}: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    } else {
                      return clientData.idxAiType;
                    }
                  })() : clients.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === 'client' ? 'Active AI Service' : 'Active translation service accounts'}
                  </p>
                </CardContent>
              </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(
                    user?.role === 'client'
                      ? usageData?.topClients?.find((c: any) => c._id === user.clientId)?.totalTokens || 0
                      : usageData?.summary?.totalTokens || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tokens processed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              <div className="text-2xl font-bold">
                  {formatCurrency(
                    user?.role === 'client'
                      ? usageData?.topClients?.find((c: any) => c._id === user.clientId)?.totalCost || 0
                      : usageData?.summary?.totalCost || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Revenue from translation services
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(
                    user?.role === 'client'
                      ? usageData?.topClients?.find((c: any) => c._id === user.clientId)?.totalRequests || 0
                      : usageData?.summary?.totalRequests || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  API requests processed
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
          {user?.role !== 'client' ? (
          <>
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Token Usage Over Time</CardTitle>
                <CardDescription>
                  Daily token consumption across all clients
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: {
                    type: 'areaspline',
                    backgroundColor: 'transparent',
                    height: 280,
                  },
                  title: { text: '' },
                  xAxis: {
                    categories: recentActivity.map((item: any) =>
                      dayjs(item.date).format('MMM DD YYYY')
                    ),
                    tickmarkPlacement: 'on',
                    title: { text: null },
                    labels: {
                      style: { color: '#aaa' }, // dark-friendly
                    },
                    lineColor: 'rgba(255,255,255,0.1)',
                    gridLineColor: 'rgba(255,255,255,0.05)',
                  },
                  yAxis: {
                    title: { text: null },
                    labels: {
                      style: { color: '#aaa' },
                    },
                    gridLineColor: 'rgba(255,255,255,0.05)',
                  },
                  tooltip: {
                    shared: true,
                    valueSuffix: ' tokens',
                    backgroundColor: '#222',
                    borderColor: '#555',
                    style: { color: '#fff' },
                  },
                  plotOptions: {
                    areaspline: {
                      fillOpacity: 0.3,
                      marker: {
                        enabled: true,
                        radius: 4,
                        Symbol: 'circle'
                      },
                      lineWidth: 2,
                      color: '#00c3ff', // bright blue for dark bg
                    },
                  },
                  series: [{
                    name: 'Tokens',
                    data: recentActivity.map((item: any) => item.tokens),
                    showInLegend: false,
                  }],
                  legend: { enabled: false },
                  credits: { enabled: false },
                }}
              />
              </CardContent>
            </Card>
              
            <Card className="col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Translation Types</CardTitle>
                <CardDescription>
                  Usage breakdown by translation service type
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <HighchartsReact
                  highcharts={Highcharts}
                  options={{
                    chart: {
                      type: 'column',
                      backgroundColor: 'transparent',
                      height: 280,
                    },
                    title: { text: '' },
                    xAxis: {
                      categories: usageData.byTypes?.map((item: any) => item.label),
                      title: { text: null }, // Removed axis title
                      labels: { style: { color: '#666' } }
                    },
                    yAxis: {
                      min: 0,
                      title: { text: null }, // Removed axis title
                      labels: { style: { color: '#666' } },
                      gridLineColor: 'rgba(200,200,200,0.1)'
                    },
                    tooltip: {
                      backgroundColor: 'white',
                      borderColor: '#ccc',
                      style: { color: '#000' },
                      pointFormat: 'Tokens used: <b>{point.y}</b>'
                    },
                    plotOptions: {
                      column: {
                        colorByPoint: true,
                        borderWidth: 0,
                      }
                    },
                    colors: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'],
                    series: [{
                      name: 'Tokens',
                      data: usageData.byTypes?.map((item: any) => item.tokens),
                    }],
                    credits: { enabled: false },
                    legend: { enabled: false },
                    accessibility: {
                      enabled: true,
                      keyboardNavigation: {
                        enabled: true,
                        focusBorder: { style: { color: '#000', borderWidth: 2 } }
                      },
                      landmarkVerbosity: 'one',
                      describeSingleSeries: true
                    }
                  }}
                />
              </CardContent>
            </Card>
          </>
          ) : (
            <>
              <Card className="col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle>Usage by Language</CardTitle>
                  <CardDescription>Your recent translation language combinations</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                <HighchartsReact
                    highcharts={Highcharts}
                    options={{
                      chart: { type: 'column', backgroundColor: 'transparent', height: 280 },
                      title: { text: '' },
                      xAxis: {
                        categories: Object.keys(
                          usageData.records
                            ?.filter((r: any) => r.clientId === user.clientId)
                            ?.reduce((acc: any, cur: any) => {
                              const key = `${cur.baseLanguage} → ${cur.targetLanguage}`;
                              acc[key] = (acc[key] || 0) + cur.tokens;
                              return acc;
                            }, {}) || {}
                        ),
                        labels: { style: { color: '#666' } }
                      },
                      yAxis: {
                        min: 0,
                        title: { text: 'Tokens' },
                        labels: { style: { color: '#666' } },
                        gridLineColor: 'rgba(200,200,200,0.1)'
                      },
                      tooltip: {
                        backgroundColor: 'white',
                        borderColor: '#ccc',
                        style: { color: '#000' },
                        pointFormat: 'Tokens used: <b>{point.y}</b>'
                      },
                      plotOptions: {
                        column: {
                          colorByPoint: true,
                          borderWidth: 0,
                        }
                      },
                      series: [{
                        name: 'Tokens',
                        data: Object.values(
                          usageData.records
                            ?.filter((r: any) => r.clientId === user.clientId)
                            ?.reduce((acc: any, cur: any) => {
                              const key = `${cur.baseLanguage} → ${cur.targetLanguage}`;
                              acc[key] = (acc[key] || 0) + cur.tokens;
                              return acc;
                            }, {}) || {}
                        )
                      }],
                      credits: { enabled: false },
                      legend: { enabled: false },
                    }}
                  />
                </CardContent>
              </Card>
              {recentActivity?.length > 0 && (
                <Card className="col-span-2 lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Your Token Activity</CardTitle>
                    <CardDescription>Daily token usage</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={{
                        chart: { type: 'spline', backgroundColor: 'transparent', height: 280 },
                        title: { text: '' },
                        xAxis: {
                          categories: recentActivity.map((item: any) =>
                            dayjs(item.date, 'D/M/YYYY').format('DD MMM YYYY')
                          ),                          
                          labels: { style: { color: '#aaa' } }
                        },
                        yAxis: {
                          title: { text: null },
                          labels: { style: { color: '#aaa' } },
                          gridLineColor: 'rgba(255,255,255,0.05)'
                        },
                        tooltip: {
                          shared: true,
                          valueSuffix: ' tokens',
                          backgroundColor: '#222',
                          borderColor: '#555',
                          style: { color: '#fff' },
                        },
                        series: [{
                          name: 'Tokens',
                          data: recentActivity.map((item: any) => item.tokens),
                          showInLegend: false,
                        }],
                        credits: { enabled: false },
                        legend: { enabled: false },
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
            
            {user?.role !== 'client' ? (
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Clients</CardTitle>
                  <CardDescription>Clients with highest token usage</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/usage">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageData?.topClients?.slice(0, 5).map((client: any) => (
                    <div key={client._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{client.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(client.totalTokens)} tokens
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(client.totalCost)}
                      </div>
                    </div>
                  ))}
                  {(!usageData?.topClients || usageData.topClients.length === 0) && (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">No client data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Recent Usage Records</CardTitle>
                <CardDescription>
                  Latest {usageData.records.find((r: any) => r.clientId === user.clientId)?.idxAiType === 'Prompt AI' 
                    ? 'prompt requests' 
                    : 'translation requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-none border">
                  {/* Header Row */}
                  {usageData.records.find((r: any) => r.clientId === user.clientId)?.idxAiType === 'Prompt AI' ? (
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
                    {usageData.records
                      .filter((r: any) => r.clientId === user.clientId)
                      .slice(0, 10)
                      .map((record: any) =>
                        record.idxAiType === 'Prompt AI' ? (
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
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </>
      )}
    </div>
  );
}