import { NextRequest, NextResponse } from 'next/server';
import { writeData, readData } from '@/util/dataStore';

export async function POST(req: NextRequest) {
  try {
    console.log('Incoming POST request at /api/saveData');
    const data = await req.json();
    console.log('Data received:', data);
    if (data) {
      writeData(data); // Replace existing data with new data
      console.log('Data saved:', data);
      return NextResponse.json({ message: 'Data saved successfully', data }, { status: 200 });
    } else {
      console.error('No data received');
      return NextResponse.json({ message: 'No data received' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json({ message: 'Failed to save data', error }, { status: 500 });
  }
}
