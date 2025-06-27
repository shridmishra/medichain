import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error('Pinata credentials not set in environment variables');
    return res.status(500).json({ error: 'Storage service not configured' });
  }

  const form = formidable({});
  let fields: formidable.Fields;
  let files: formidable.Files;

  try {
    [fields, files] = await form.parse(req);
  } catch (error) {
    console.error('Error parsing form data:', error);
    return res.status(400).json({ error: 'Invalid form data' });
  }

  const file = files.file?.[0];
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const publicKey = fields.publicKey?.[0];
  if (!publicKey || typeof publicKey !== 'string') {
    return res.status(400).json({ error: 'Public key is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { publicKey } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Upload file to IPFS using Pinata
    const fileBuffer = await fs.promises.readFile(file.filepath);
    const fileName = `${Date.now()}-${file.originalFilename}`;
    
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: file.mimetype || 'application/octet-stream',
    });

    console.log('Attempting to upload file to IPFS via Pinata...');
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Pinata API error:', error);
      throw new Error(`Pinata API error: ${error}`);
    }

    const data = await response.json();
    console.log('File uploaded successfully with IPFS hash:', data.IpfsHash);

    // Create record in database
    const record = await prisma.record.create({
      data: {
        userId: user.id,
        pointer: data.IpfsHash,
      },
    });

    return res.status(200).json({ record });
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 