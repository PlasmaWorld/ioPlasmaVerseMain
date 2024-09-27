// pages/api/saveContractStats.ts

import { NextRequest, NextResponse } from 'next/server';
import { createContractStatsTable, pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await createContractStatsTable(); // Ensure the table exists

    const contractData = await req.json();
    for (const [contractAddress, data] of Object.entries(contractData)) {
      const { totalSupply, validTotalSupply, uniqueOwners, chainId } = data as {
        totalSupply: number;
        validTotalSupply: number;
        uniqueOwners: number;
        chainId: number;
      };

      // Upsert (insert or update) the data in the contract_stats table
      await pool.query(
        `
        INSERT INTO contract_total_supply (contract_address, total_supply, valid_total_supply, unique_owners, chain_id, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (contract_address)
        DO UPDATE SET
          total_supply = EXCLUDED.total_supply,
          valid_total_supply = EXCLUDED.valid_total_supply,
          unique_owners = EXCLUDED.unique_owners,
          chain_id = EXCLUDED.chain_id,
          last_updated = NOW();
        `,
        [contractAddress, totalSupply, validTotalSupply, uniqueOwners, chainId] // Passing 5 parameters now
      );      
    }

    return NextResponse.json({ message: 'Contract stats updated successfully' });
  } catch (error) {
    console.error('Error updating contract stats:', error as Error);

    return NextResponse.json(
      { error: 'Failed to update contract stats', details: (error as Error).message },
      { status: 500 }
    );
  }
}
