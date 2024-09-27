// pages/api/saveLatestBlock.ts
import { NextRequest, NextResponse } from 'next/server';
import { createLatestBlockHeightTable, pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await createLatestBlockHeightTable();

    const { contractAddress, latestBlockHeight } = await req.json();

    if (!contractAddress || !latestBlockHeight) {
      return NextResponse.json(
        { error: 'Missing contractAddress or latestBlockHeight in request body' },
        { status: 400 }
      );
    }

    await pool.query(
      `
      INSERT INTO latest_block_height (contract_address, latest_block_height)
      VALUES ($1, $2)
      ON CONFLICT (contract_address)
      DO UPDATE SET latest_block_height = $2, updated_at = CURRENT_TIMESTAMP;
      `,
      [contractAddress, latestBlockHeight.toString()]
    );

    return NextResponse.json({ message: 'Latest block height saved successfully' });
  } catch (error) {
    console.error('Error saving latest block height:', error);
    return NextResponse.json(
      { error: 'Failed to save latest block height' , details: (error as Error).message},
      { status: 500 }
    );
  }
}
