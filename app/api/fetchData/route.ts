import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/util/dataStore';

export async function GET(req: NextRequest) {
  try {
    console.log('Incoming GET request at /api/fetchData');
    const data = readData();
    console.log('Data being sent:', data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ message: 'Failed to fetch data', error }, { status: 500 });
  }
}
