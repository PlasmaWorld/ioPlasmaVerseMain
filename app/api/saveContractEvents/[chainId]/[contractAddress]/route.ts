// pages/api/saveContractEvents/[chainId]/[contractAddress]/route.ts

import { fetchEvents } from '@/lib/fetchedEvents2';
import { NextRequest, NextResponse } from 'next/server';

// Utility function to delay execution
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest, { params }: { params: { chainId: string, contractAddress: string } }) {
  const { chainId, contractAddress } = params;

  console.log("Received request to save events for:", { chainId, contractAddress });

  try {
    // Validate and parse chainId
    const chainIdNumber = parseInt(chainId, 10);
    if (isNaN(chainIdNumber)) {
      return NextResponse.json({ error: 'Invalid chainId' }, { status: 400 });
    }

    // Validate contractAddress
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json({ error: 'Invalid contractAddress' }, { status: 400 });
    }

    // Fetch and save events
    const savedEvents = await fetchEvents(chainIdNumber, contractAddress);
    
    if (!savedEvents || savedEvents.length === 0) {
      return NextResponse.json({ message: 'No events found or saved' }, { status: 404 });
    }

    // Call fetchEvents for each saved event with a delay
    for (const event of savedEvents) {
      await fetchEvents(chainIdNumber, contractAddress);
      console.log('Fetched and processed event for:', event); // Log for debugging
      // Delay for 1 minute (60000 milliseconds) before the next fetch
      await delay(300000);
    }

    // Return success response
    return NextResponse.json({ message: 'Events saved successfully', events: savedEvents });

  } catch (error) {
    console.error('Error saving events:', error);
    return NextResponse.json({ error: 'Failed to save events', details: (error as Error).message }, { status: 500 });
  }
}
