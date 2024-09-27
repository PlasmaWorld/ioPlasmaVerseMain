
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Ensure this matches your setup

export async function GET(req: NextRequest) {
  try {
    console.log('Incoming GET request at /api/Contract');

    // Fetch data from the 'contracts' table using the pool
    const result = await pool.query('SELECT * FROM contracts');

    if (result.rows.length === 0) {
      console.log('No contracts found in the database.');
    } else {
      console.log('Contracts found:', result.rows);
    }

    const contracts = result.rows; // Extract the rows from the query result

    console.log('Contracts being sent:', contracts);

    return NextResponse.json({ contracts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching contracts:', error);

    return NextResponse.json(
      { message: 'Failed to fetch contracts', error: (error as Error).message },
      { status: 500 }
    );
  }
}
