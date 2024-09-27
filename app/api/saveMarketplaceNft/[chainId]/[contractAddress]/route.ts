// pages/api/saveContractEvents/[chainId]/[contractAddress]/route.ts

import { createMarketplaceNftContractsTable, createMarketplaceTable, pool } from '@/lib/db';
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
    const tableName = `api_route_marketplace_contract_${chainId}_${contractAddress}`;

    // Fetch and save events
    await createMarketplaceNftContractsTable(tableName);
    console.log("Verified contracts table existence");

    const contractData = await req.json();
    console.log("Received contract data:", contractData);

    // Check if the contract has already been imported by this deployer
    const existingContract = await pool.query(`
      SELECT id FROM ${tableName} 
      WHERE deployerAddress = $1 
      AND contractAddress = $2
    `, [contractData.deployerAddress, contractData.contractAddress]);

    if (existingContract.rows.length > 0) {
      console.log("Contract already exists, preventing duplicate import");
      return NextResponse.json(
        { error: 'Contract already imported by this deployer' },
        { status: 400 } // Bad Request
      );
    }

    // Insert data into the contracts table using the pool
    const result = await pool.query(`
      INSERT INTO ${tableName} (
        deployerAddress,
        contractAddress,
        chain,
        chainId,
        title,
        description,
        thumbnailUrl,
        explorer,
        type,
        currencyContractAddress,
        social_urls,
        createdAt
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      ) RETURNING id
    `, [
      contractData.deployerAddress,
      contractData.contractAddress,
      contractData.chain,
      contractData.chainId,
      contractData.title,
      contractData.description,
      contractData.thumbnailUrl,
      contractData.explorer,
      contractData.type,
      contractData.currencyContractAddress,
      JSON.stringify(contractData.social_urls)
    ]);

    // Return success response
    return NextResponse.json({ message: 'Events saved successfully' });

  } catch (error) {
    console.error('Error saving events:', error);
    return NextResponse.json({ error: 'Failed to save events', details: (error as Error).message }, { status: 500 });
  }
}
