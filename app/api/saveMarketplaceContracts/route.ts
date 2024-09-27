import { NextRequest, NextResponse } from 'next/server';
import { createContractsTable, createMarketplaceTable, pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log("Starting POST request to save contract");

    // Ensure the table exists
    await createMarketplaceTable();
    console.log("Verified contracts table existence");

    const contractData = await req.json();
    console.log("Received contract data:", contractData);

    // Check if the contract has already been imported by this deployer
    const existingContract = await pool.query(`
      SELECT id FROM contracts 
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
      INSERT INTO marketplace (
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

    console.log("Contract saved successfully with ID:", result.rows[0].id);
    return NextResponse.json({ message: 'Contract saved successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error saving contract:', error);

    return NextResponse.json(
      { error: 'Failed to save contract', details: (error as Error).message },
      { status: 500 }
    );
  }
}
