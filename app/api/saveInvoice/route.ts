// pages/api/saveInvoice.ts

import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceTable, pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await createInvoiceTable(); // Ensure the table exists

    const { deployerAddress } = await req.json();

    // Insert or update the data in the invoice table
    await pool.query(
      `
      INSERT INTO invoice (deployerAddress)
      VALUES ($1)
      ON CONFLICT (deployerAddress)
      DO NOTHING;  -- or DO UPDATE SET deployerAddress = EXCLUDED.deployerAddress;
      `,
      [deployerAddress]
    );

    return NextResponse.json({ message: 'Invoice saved successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error as Error);

    return NextResponse.json(
      { error: 'Failed to save invoice', details: (error as Error).message },
      { status: 500 }
    );
  }
}
