import { NextRequest, NextResponse } from 'next/server';
import { fetchEventsWhenTableExists, fetchIoPlasmaContract, fetchMimoMarketplace } from '@/lib/watchContractEvents';

export async function POST(req: NextRequest) {
  try {
    console.log("Starting POST request to fetchMarketplace");

    // Define the contract addresses
    const contractAddresses = [
      "0x7D150D3eb3aD7aB752dF259c94A8aB98d700FC00".toLowerCase(),
      "0x9756E951dd76e933e34434Db4Ed38964951E588b".toLowerCase(),
      "0x7f8Cb1d827F26434da652b4e9bd02c698cc2842a".toLowerCase(),
      "0xDFBbEbA6D17b0d49861aB7f26CdA495046314370".toLowerCase(),
      "0xAf1B5063A152550aebc8d6cB0dA6936288EAb3dc".toLowerCase(),
      "0x7f37290ea2d4b25dc92869ad127c38db273df8ee".toLowerCase(),
      "0x50b39041d55e7a1f24e9013916f894255cdfca8b".toLowerCase(),
      "0xd40171fa36990a81eb528e10a151b492b0df55a4".toLowerCase(),
      "0x8ffcd1b97639d0be0f9ec18e97cec1ab03a8bb10".toLowerCase()
    ];

    // Use Promise.all to fetch all events concurrently
    await Promise.all(contractAddresses.map(fetchEventsWhenTableExists));

    return NextResponse.json({ message: 'Contracts fetched and saved successfully' });
  } catch (error) {
    console.error('Error fetching contracts:', error);

    return NextResponse.json(
      { error: 'Failed to fetch contracts', details: (error as Error).message },
      { status: 500 }
    );
  }
}