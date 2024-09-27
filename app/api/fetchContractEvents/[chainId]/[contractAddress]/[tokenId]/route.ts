import { pool } from "@/lib/db";  // Ensure correct import path

export async function GET(req: Request, { params }: { params: { chainId: string, contractAddress: string, tokenId: string } }) {
  const { chainId, contractAddress, tokenId } = params;

  // Validate chainId
  const chainIdNumber = parseInt(chainId, 10);
  if (isNaN(chainIdNumber)) {
    return new Response(JSON.stringify({ error: 'Invalid chainId' }), { status: 400 });
  }

  // Validate tokenId
  const tokenIdToNumber = parseInt(tokenId, 10);
  if (isNaN(tokenIdToNumber)) {
    return new Response(JSON.stringify({ error: 'Invalid tokenId' }), { status: 400 });
  }

  // Validate contractAddress
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    return new Response(JSON.stringify({ error: 'Invalid contractAddress' }), { status: 400 });
  }

  const tableName = `api_route_contract_events_${chainIdNumber}_${sanitizeTableName(contractAddress).toLowerCase()}`;

  try {
    // Fetch events for the specific tokenId from the database
    const query = `
      SELECT * FROM "${tableName}"
      WHERE token_id = $1
      ORDER BY block_number DESC
    `;
    
    const { rows } = await pool.query(query, [tokenIdToNumber]);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ message: 'No events found for the specified tokenId' }), { status: 404 });
    }

    return new Response(JSON.stringify({ events: rows }), { status: 200 });
  } catch (error) {
    console.error('Error fetching events:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch events', details: (error as Error).message }), { status: 500 });
  }
}

function sanitizeTableName(name: string): string {
  return name.replace(/[^a-z0-9_]/gi, '_').toLowerCase(); // Ensure table name is safe
}
