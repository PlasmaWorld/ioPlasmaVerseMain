import { NextRequest, NextResponse } from 'next/server';
import { fetchIoPlasmaContract, fetchMimoMarketplace } from '@/lib/watchContractEvents';

export async function POST(req: NextRequest) {
  try {
    console.log("Starting POST request to fetchMarketplace");

    // Call the marketplace event fetching functions and let them handle their logic
    await fetchMimoMarketplace();
    await fetchIoPlasmaContract();

    return NextResponse.json({ message: 'Contract saved successfully' });
  } catch (error) {
    console.error('Error saving contract:', error);

    return NextResponse.json(
      { error: 'Failed to save contract', details: (error as Error).message },
      { status: 500 }
    );
  }
}
