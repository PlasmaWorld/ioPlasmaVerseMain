import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    console.log('Incoming GET request at /api/fetchInvoice');

    // Fetch data from the 'contract_stats' table using the pool
    const result = await pool.query('SELECT * FROM invoice');

    const data = result.rows; // Extract the rows from the query result

    console.log('Data being sent:');

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ message: 'Failed to fetch data', error: (error as Error).message }, { status: 500 });
  }
}
