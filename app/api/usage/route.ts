import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const period = searchParams.get('period') || '30days'; // Default to 30 days
    
    const db = await getDb();
    
    let dateFilter: Date;
    const now = new Date();
    
    // Calculate date filter based on period
    switch (period) {
      case '7days':
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        dateFilter = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90days':
        dateFilter = new Date(now.setDate(now.getDate() - 90));
        break;
      case 'year':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFilter = new Date(now.setDate(now.getDate() - 30));
    }
    
    let pipeline = [];
    
    // If clientId is provided, filter by client
    if (clientId) {
      const filters = {
        clientId: clientId,
        timestamp: { $gte: dateFilter }
      };
      
      // Get client usage records
      const usageRecords = await db.collection('usageRecords')
        .find(filters)
        .sort({ timestamp: -1 })
        .toArray();
        
      // Get aggregated data
      pipeline = [
        { $match: filters },
        { 
          $group: {
            _id: null,
            totalTokens: { $sum: "$tokens" },
            totalCost: { $sum: "$cost" },
            avgTokensPerRequest: { $avg: "$tokens" },
            count: { $sum: 1 }
          }
        }
      ];
      
      const summary = await db.collection('usageRecords').aggregate(pipeline).toArray();
      
      // Get usage by translation type
      pipeline = [
        { $match: filters },
        { 
          $group: {
            _id: "$translationType",
            tokens: { $sum: "$tokens" },
            cost: { $sum: "$cost" },
            count: { $sum: 1 }
          }
        }
      ];
      
      const byType = await db.collection('usageRecords').aggregate(pipeline).toArray();
      
      // Get usage by day
      pipeline = [
        { $match: filters },
        {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" }
            },
            tokens: { $sum: "$tokens" },
            cost: { $sum: "$cost" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ];
      
      const byDay = await db.collection('usageRecords').aggregate(pipeline).toArray();
      
      return NextResponse.json({
        records: usageRecords,
        summary: summary[0] || { totalTokens: 0, totalCost: 0, avgTokensPerRequest: 0, count: 0 },
        byType,
        byDay
      });
    } else {
      // Get overall usage for all clients
      
      // Get top clients by usage
      pipeline = [
        { $match: { timestamp: { $gte: dateFilter } } },
        { 
          $group: {
            _id: "$clientId",
            clientName: { $first: "$clientName" },
            totalTokens: { $sum: "$tokens" },
            totalCost: { $sum: "$cost" },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalTokens: -1 } },
        { $limit: 10 }
      ];
      
      const topClients = await db.collection('usageRecords').aggregate(pipeline).toArray();
      
      // Get usage by translation type
      pipeline = [
        { $match: { timestamp: { $gte: dateFilter } } },
        { 
          $group: {
            _id: "$translationType",
            tokens: { $sum: "$tokens" },
            cost: { $sum: "$cost" },
            count: { $sum: 1 }
          }
        }
      ];
      
      const byType = await db.collection('usageRecords').aggregate(pipeline).toArray();
      
      // Get daily usage
      pipeline = [
        { $match: { timestamp: { $gte: dateFilter } } },
        {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" }
            },
            tokens: { $sum: "$tokens" },
            cost: { $sum: "$cost" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ];
      
      const byDay = await db.collection('usageRecords').aggregate(pipeline).toArray();
      
      // Get total summary
      pipeline = [
        { $match: { timestamp: { $gte: dateFilter } } },
        { 
          $group: {
            _id: null,
            totalTokens: { $sum: "$tokens" },
            totalCost: { $sum: "$cost" },
            totalRequests: { $sum: 1 }
          }
        }
      ];
      
      const summary = await db.collection('usageRecords').aggregate(pipeline).toArray();
      
      return NextResponse.json({
        topClients,
        byType,
        byDay,
        summary: summary[0] || { totalTokens: 0, totalCost: 0, totalRequests: 0 }
      });
    }
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Error fetching usage data' },
      { status: 500 }
    );
  }
}