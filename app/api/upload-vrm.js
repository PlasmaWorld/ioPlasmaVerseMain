// pages/api/upload-vrm.js

import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Process VRM file upload
      const file = req.body.file; // Assume file is sent in the body for simplicity
      const uploadPath = path.join(process.cwd(), 'uploads', file.name);
      await fs.writeFile(uploadPath, file.data);
      res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error uploading file' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
