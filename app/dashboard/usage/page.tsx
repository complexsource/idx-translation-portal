"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Wallet } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import dayjs from 'dayjs';
import { useAuth } from '@/providers/auth-provider';

export default function UsagePage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [period, setPeriod] = useState('30days');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [triggerDateFilter, setTriggerDateFilter] = useState(false);
  //console.log(usageData);
  
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  //console.log(usageData);  
  useEffect(() => {

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch usage data
        let url = `/api/usage?period=${period}`;

        if (clientId) {
          url += `&clientId=${clientId}`;
        }

        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
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
        if ((startDate && !endDate) || (!startDate && endDate)) {
          toast({
            variant: 'destructive',
            title: 'Invalid Date Range',
            description: 'Please select both start and end dates.',
          });
          setIsLoading(false);
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [clientId, period, triggerDateFilter, toast]);
  
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
    if (startDate && endDate) {
      return `${dayjs(startDate).format('MMM D')} – ${dayjs(endDate).format('MMM D, YYYY')}`;
    }
    switch (period) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      default: return 'Custom Range';
    }
  };  

  const [search, setSearch] = useState('');
  const filteredClients = usageData?.topClients
  ?.filter((client: any) =>
    client.clientName.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);
  
  return (
     <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Left: Heading and Back Button */}
          <div className="flex-1 min-w-0 flex items-center">
            {clientId && (
              <Button variant="ghost" size="sm" asChild className="mr-2 shrink-0">
                <Link href="/dashboard/usage">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  All Usage
                </Link>
              </Button>
            )}
            <h1 className="text-3xl font-bold truncate">
              {clientId && client ? `${client.name} Usage` : 'Overall Usage'}
            </h1>
          </div>

          {/* Right: Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
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

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-border bg-background text-foreground px-3 py-2 text-sm rounded-md"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-border bg-background text-foreground px-3 py-2 text-sm rounded-md"
              />
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (startDate && endDate) {
                  setTriggerDateFilter(prev => !prev);
                } else {
                  toast({
                    variant: 'destructive',
                    title: 'Invalid Range',
                    description: 'Please select both start and end dates.',
                  });
                }
              }}
            >
              Show Data
            </Button>
          </div>
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
            <div className={`grid gap-6 ${clientId ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              {/* AI Service Card for Client */}
              {clientId && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-medium ${usageData.records[0]?.idxAiType !== 'Search AI' && !usageData.records[0]?.idxdb ? 'mb-[30px]' : ''}`}>AI Service</CardTitle>
                    {usageData.records[0]?.idxAiType === 'Search AI' && usageData.records[0]?.idxdb && (
                      <CardDescription>
                        {usageData.records[0].idxdb}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const record = usageData?.records?.[0];
                        console.log(record);
                        if (!record) return 'N/A';
                
                        if (record.idxAiType === 'Translate AI' && record.translationType) {
                          const type = record.translationType;
                          return `${record.idxAiType}: ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                        }
                
                        return record.idxAiType || 'N/A';
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active AI Service
                    </p>
                  </CardContent>
                </Card>            
              )}
              {/* Total Tokens */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                  <CardDescription>{getPeriodName()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(usageData?.summary?.totalTokens || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total tokens processed
                  </p>
                </CardContent>
              </Card>

              {/* Total Cost */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <CardDescription>{getPeriodName()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(usageData?.summary?.totalCost || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost of tokens processed
                  </p>
                </CardContent>
              </Card>

              {/* Total Requests */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <CardDescription>{getPeriodName()}</CardDescription>
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
            
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="w-full">
                <CardHeader>
                  <CardTitle>Token Usage Over Time</CardTitle>
                  <CardDescription>Daily token consumption</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {usageData?.byDay?.length > 0 ? (
                    <HighchartsReact
                    highcharts={Highcharts}
                    options={{
                      chart: {
                        type: 'areaspline',
                        backgroundColor: 'transparent',
                        height: 280
                      },
                      title: { text: null },
                      xAxis: {
                        categories: usageData.byDay.map((day: any) =>
                          dayjs(`${day._id.month}/${day._id.day}/${day._id.year}`, 'M/D').format('MMM DD YYYY')
                        ),
                        tickmarkPlacement: 'on',
                        labels: { style: { color: '#aaa' } },
                        lineColor: 'rgba(255,255,255,0.1)',
                        gridLineColor: 'rgba(255,255,255,0.05)',
                        title: { text: null }
                      },
                      yAxis: {
                        min: 0,
                        title: { text: null },
                        labels: { style: { color: '#aaa' } },
                        gridLineColor: 'rgba(255,255,255,0.05)'
                      },
                      tooltip: {
                        shared: false, // ✅ separate tooltip per point
                        useHTML: true,
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        style: { color: 'var(--foreground)' },
                        formatter: function (this: Highcharts.Point): string {
                          //console.log(this);
                          return `
                            <!-- <strong>${this.x}</strong><br/> -->
                            Tokens: <b>${(this.y as number).toLocaleString()}</b>
                          `;
                        }            
                      },
                      plotOptions: {
                        areaspline: {
                          fillOpacity: 0.3,
                          lineWidth: 2,
                          marker: {
                            enabled: true,
                            radius: 4,
                            symbol: 'circle'
                          },
                          color: 'hsl(var(--chart-1))',
                          states: {
                            hover: {
                              lineWidth: 3
                            }
                          }
                        }
                      },
                      series: [
                        {
                          name: 'Tokens',
                          data: usageData.byDay.map((day: any) => day.tokens),
                          showInLegend: false
                        }
                      ],
                      credits: { enabled: false },
                      legend: { enabled: false },
                      accessibility: { enabled: true }
                    }}
                  />        
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
              
            {clientId && client?.idxAiType === 'Translate AI' ? (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Usage by Language</CardTitle>
                  <CardDescription>Your recent translation language combinations</CardDescription>
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
                        categories: Object.keys(
                          usageData.records
                            ?.filter((r: any) => r.clientId === clientId)
                            ?.reduce((acc: any, cur: any) => {
                              const key = `${cur.baseLanguage} → ${cur.targetLanguage}`;
                              acc[key] = (acc[key] || 0) + cur.tokens;
                              return acc;
                            }, {}) || {}
                        ),
                        labels: { style: { color: '#666' } },
                      },
                      yAxis: {
                        min: 0,
                        title: { text: 'Tokens' },
                        labels: { style: { color: '#666' } },
                        gridLineColor: 'rgba(200,200,200,0.1)',
                      },
                      tooltip: {
                        backgroundColor: 'white',
                        borderColor: '#ccc',
                        style: { color: '#000' },
                        pointFormat: 'Tokens used: <b>{point.y}</b>',
                      },
                      plotOptions: {
                        column: {
                          colorByPoint: true,
                          borderWidth: 0,
                        },
                      },
                      series: [
                        {
                          name: 'Tokens',
                          data: Object.values(
                            usageData.records
                              ?.filter((r: any) => r.clientId === clientId)
                              ?.reduce((acc: any, cur: any) => {
                                const key = `${cur.baseLanguage} → ${cur.targetLanguage}`;
                                acc[key] = (acc[key] || 0) + cur.tokens;
                                return acc;
                              }, {}) || {}
                          ),
                        },
                      ],
                      credits: { enabled: false },
                      legend: { enabled: false },
                    }}
                  />
                </CardContent>
              </Card>
            ) : (!clientId || !client?.idxAiType) && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Usage by Translation Type</CardTitle>
                  <CardDescription>Distribution across different translation services</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {usageData?.byTypes?.length > 0 ? (
                    <HighchartsReact
                      highcharts={Highcharts}
                      options={{
                        chart: {
                          type: 'pie',
                          backgroundColor: 'transparent',
                          height: 280,
                        },
                        title: { text: null },
                        tooltip: {
                          useHTML: true,
                          backgroundColor: '#222',
                          borderColor: '#555',
                          style: { color: '#fff' },
                          formatter: function (this: Highcharts.Point): string {
                            return `
                              <span style="color: white"><b>${this.name}</b></span><br/>
                              ${this.percentage?.toFixed(0)}% (${this.y} tokens)
                            `;
                          },
                        },
                        plotOptions: {
                          pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                              enabled: true,
                              format: '{point.percentage:.0f}%',
                              style: { color: '#ccc' },
                            },
                            showInLegend: true,
                          },
                        },
                        series: [
                          {
                            name: 'Tokens',
                            colorByPoint: true,
                            data: usageData.byTypes.map((entry: any) => ({
                              name: entry.label,
                              y: entry.tokens,
                            })),
                          },
                        ],
                        legend: {
                          enabled: true,
                          layout: 'horizontal',
                          align: 'center',
                          verticalAlign: 'bottom',
                          itemStyle: {
                            color: '#ccc',
                            fontWeight: 'normal',
                          },
                        },
                        credits: { enabled: false },
                        accessibility: {
                          enabled: true,
                          point: { valueSuffix: ' tokens' },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Wallet className="h-12 w-12 text-muted-foreground mb-2" />
                      <h3 className="font-medium">No data available</h3>
                      <p className="text-sm text-muted-foreground">No usage data for this period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                    <>
                      <input
                        type="text"
                        placeholder="Search client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-4 w-full px-3 py-2 text-sm border rounded-none bg-background text-foreground border-border"
                      />
                      <HighchartsReact
                        highcharts={Highcharts}
                        options={{
                          chart: {
                            type: 'bar',
                            backgroundColor: 'transparent',
                            height: Math.max(400, filteredClients.length * 30),
                          },
                          title: { text: null },
                          xAxis: {
                            categories: filteredClients.map((c: { clientName: string }) => c.clientName),
                            title: { text: null },
                            labels: { style: { color: '#ccc', fontSize: '12px' } }
                          },
                          yAxis: {
                            min: 0,
                            title: { text: null },
                            labels: { style: { color: '#aaa' } },
                            gridLineColor: 'rgba(255,255,255,0.05)'
                          },
                          tooltip: {
                            useHTML: true,
                            backgroundColor: '#222',
                            borderColor: '#555',
                            style: { color: '#fff' },
                            formatter: function (this: Highcharts.Point): string {
                              const client = filteredClients[this.index];
                              return `
                                <b>${client.clientName}</b><br/>
                                Tokens: ${client.totalTokens.toLocaleString()}<br/>
                                Cost: $${parseFloat(client.totalCost.toFixed(6))}
                              `;
                            }
                          },
                          plotOptions: {
                            bar: {
                              borderWidth: 0,
                            }
                          },
                          series: [{
                            name: 'Tokens',
                            data: filteredClients.map((c: { totalTokens: number }) => ({
                              y: c.totalTokens,
                              color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') // Random hex color
                            })),
                            showInLegend: false,
                          }],
                          credits: { enabled: false },
                          legend: { enabled: false },
                          accessibility: { enabled: true }
                        }}
                      />
                    </>
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
                    Latest {client?.idxAiType === 'Prompt AI' ? 'prompt requests' : client?.idxAiType === 'Search AI' ? 'Search requests' : 'translation requests'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-none border">
                      {/* Header Row */}

                      {(() => {
                      if (client?.idxAiType === 'Prompt AI') {
                        return (
                          <div className="grid grid-cols-[260px_1fr_100px_100px] p-4 font-medium border-b">
                            <div>Date</div>
                            <div>Prompt</div>
                            <div>Tokens</div>
                            <div>Cost</div>
                          </div>
                        );
                      } else if (client?.idxAiType === 'Search AI') {
                        return (
                          <div className="grid grid-cols-[260px_160px_1fr_100px_100px] p-4 font-medium border-b">
                            <div>Date</div>
                            <div>Search Query</div>
                            <div>Database Query</div>
                            <div>Tokens</div>
                            <div>Cost</div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="grid grid-cols-[260px_160px_1fr_100px_100px] p-4 font-medium border-b">
                            <div>Date</div>
                            <div>Type</div>
                            <div>Languages</div>
                            <div>Tokens</div>
                            <div>Cost</div>
                          </div>
                        );
                      }
                    })()}

                    {/* Data Rows */}
                    <div className="divide-y">
                      {usageData.records.slice(0, 10).map((record: any) => {
                        if (client?.idxAiType === 'Prompt AI') {
                          return (
                            <div key={record._id} className="grid grid-cols-[260px_1fr_100px_100px] p-4 text-sm">
                              <div>{new Date(record.timestamp).toLocaleString()}</div>
                              <div className="truncate">{record.prompt || '—'}</div>
                              <div>{formatNumber(record.tokens)}</div>
                              <div>{formatCurrency(record.cost)}</div>
                            </div>
                          );
                        } else if (client?.idxAiType === 'Search AI') {
                          return (
                            <div key={record._id} className="grid grid-cols-[260px_160px_1fr_100px_100px] p-4 text-sm">
                              <div>{new Date(record.timestamp).toLocaleString()}</div>                              
                              <div className="capitalize">{record.prompt}</div>
                              <div className="truncate">{record.generatedQuery}</div>
                              <div>{formatNumber(record.tokens)}</div>
                              <div>{formatCurrency(record.cost)}</div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={record._id} className="grid grid-cols-[260px_160px_1fr_100px_100px] p-4 text-sm">
                              <div>{new Date(record.timestamp).toLocaleString()}</div>
                              <div className="capitalize">{record.translationType}</div>
                              <div>{record.baseLanguage} → {record.targetLanguage}</div>
                              <div>{formatNumber(record.tokens)}</div>
                              <div>{formatCurrency(record.cost)}</div>
                            </div>
                          );
                        }
                      })}
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