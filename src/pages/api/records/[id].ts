import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Record ID is required' });
  }

  try {
    // Convert string id to integer
    const recordId = parseInt(id, 10);
    if (isNaN(recordId)) {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    const record = await prisma.record.findUnique({
      where: { id: recordId },
      include: {
        user: true,
      },
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (!record.pointer) {
      return res.status(404).json({ error: 'Record file not found' });
    }

    // Fetch the file from IPFS
    const ipfsResponse = await fetch(`https://ipfs.io/ipfs/${record.pointer}`);
    if (!ipfsResponse.ok) {
      throw new Error('Failed to fetch file from IPFS');
    }

    // Get the content type from the response
    const contentType = ipfsResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = ipfsResponse.headers.get('content-length');

    // Set appropriate headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', contentLength || '0');
    res.setHeader('Content-Disposition', `attachment; filename=record-${id}${contentType.includes('pdf') ? '.pdf' : ''}`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file to the client
    const buffer = await ipfsResponse.buffer();
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading record:', error);
    return res.status(500).json({ error: 'Failed to download record' });
  } finally {
    await prisma.$disconnect();
  }
} 