// pages/api/proxy.js

import axios from 'axios';

export default async function handler(req, res) {
  const { url } = req.query;

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers you need
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
}
