  import { NextRequest, NextResponse } from 'next/server';
  import { fetchEventsWhenTableExists, fetchIoPlasmaContract, fetchMimoMarketplace } from '@/lib/watchContractEvents';

  export async function POST(req: NextRequest) {
    try {
      console.log("Starting POST request to fetchMarketplace");
  
      // Define the contract addresses
      const contractAddresses = [
        "0x0c5AB026d74C451376A4798342a685a0e99a5bEe".toLowerCase(),
        "0x8aa9271665e480f0866d2F61FC436B96BF9584AD".toLowerCase(),
        "0xc52121470851d0cba233c963fcbb23f753eb8709".toLowerCase(),
        "0xce300b00aa9c066786D609Fc96529DBedAa30B76".toLowerCase(),
        "0x3acd87176676e9b93f823e5e5e1d3069171c985d".toLowerCase(),
        "0xe1Bb99ed442ce6c6ad3806C3afcbd8f7733841A7".toLowerCase(),
        "0xaa5314f9ee6a6711e5284508fec7f40e85969ed6".toLowerCase(),
        "0x0689021f9065b18c710f5204e41b3d20c3b7d362".toLowerCase(),
        "0x8cfE8bAeE219514bE529407207fCe9C612E705fD".toLowerCase(),
        "0x778E131aA8260C1FF78007cAde5e64820744F320".toLowerCase()
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