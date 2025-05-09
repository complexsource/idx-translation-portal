import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const period = searchParams.get('period') || '30days';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    const db = await getDb();

    let baseFilter: any = {};

    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999); // include full end day
      baseFilter.timestamp = { $gte: startDate, $lte: endDate };
    } else {
      const now = new Date();
      let dateFilter: Date;
      switch (period) {
        case '7days': dateFilter = new Date(now.setDate(now.getDate() - 7)); break;
        case '30days': dateFilter = new Date(now.setDate(now.getDate() - 30)); break;
        case '90days': dateFilter = new Date(now.setDate(now.getDate() - 90)); break;
        case 'year': dateFilter = new Date(now.setFullYear(now.getFullYear() - 1)); break;
        default: dateFilter = new Date(now.setDate(now.getDate() - 30));
      }
      baseFilter.timestamp = { $gte: dateFilter };
    }
    
    if (clientId) baseFilter.clientId = new ObjectId(clientId);

    const usageRecords = await db.collection('usageRecords')
      .find(baseFilter)
      .sort({ timestamp: -1 })
      .toArray();

    // Raw byType logic without Mongo aggregation
    const rawTypeMap: Record<string, number> = {};
    for (const record of usageRecords) {
      let label = 'Unknown';

      if (record.idxAiType === 'Prompt AI') {
        label = 'Prompt AI';
      } else if (record.idxAiType === 'Translate AI') {
        const type = record.translationType?.toLowerCase();
        if (['basic', 'advanced', 'expert'].includes(type)) {
          label = `TAI: ${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        } else {
          label = 'TAI: Unknown';
        }
      }

      if (!rawTypeMap[label]) rawTypeMap[label] = 0;
      rawTypeMap[label] += record.tokens || 0;
    }

    const byTypes = Object.entries(rawTypeMap).map(([label, tokens]) => ({
      label,
      tokens
    }));

    // Summary aggregation
    const summary = await db.collection('usageRecords').aggregate([
      { $match: baseFilter },
      { 
        $group: {
          _id: null,
          totalTokens: { $sum: "$tokens" },
          totalCost: { $sum: "$cost" },
          avgTokensPerRequest: { $avg: "$tokens" },
          count: { $sum: 1 },
          totalRequests: { $sum: 1 }
        }
      }
    ]).toArray();

    // Daily usage
    const byDay = await db.collection('usageRecords').aggregate([
      { $match: baseFilter },
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
    ]).toArray();

    // Top clients if not filtered by client
    let topClients: any[] = [];

    if (!clientId) {
      topClients = await db.collection('usageRecords').aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: "$clientId",
            clientName: { $first: "$clientName" },
            totalTokens: { $sum: "$tokens" },
            totalCost: { $sum: "$cost" },
            avgTokensPerRequest: { $avg: "$tokens" },
            count: { $sum: 1 },
            totalRequests: { $sum: 1 }
          }
        },
        { $sort: { totalTokens: -1 } },
        { $limit: 10 }
      ]).toArray();
    
      // Add byDay for each top client
      for (const client of topClients) {
        const clientByDay = await db.collection('usageRecords').aggregate([
          {
            $match: {
              ...baseFilter,
              clientId: client._id
            }
          },
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
        ]).toArray();
    
        client.byDay = clientByDay;
      }
    }    

    return NextResponse.json({
      records: usageRecords,
      summary: summary[0] || { totalTokens: 0, totalCost: 0, avgTokensPerRequest: 0, count: 0 },
      byDay,
      topClients,
      byTypes // this will feed your chart directly without needing Mongo aggregation
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ error: 'Error fetching usage data' }, { status: 500 });
  }
}