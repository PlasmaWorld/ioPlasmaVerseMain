// pages/api/updateTotalSupply.ts

import type { NextApiRequest, NextApiResponse } from 'next';

const updateTotalSupply = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { total_supply } = req.body;

  if (!total_supply) {
    return res.status(400).json({ message: 'Total supply is required' });
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/supply/eth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ total_supply }),
    });

    if (!response.ok) {
      throw new Error('Failed to update total supply');
    }

    const data = await response.json();
    return res.status(200).json({ message: 'Total supply updated successfully', data });
  } catch (error) {
    console.error('Error updating total supply:', error);
    return res.status(500).json({ message: 'Error updating total supply', error });
  }
};

export default updateTotalSupply;
