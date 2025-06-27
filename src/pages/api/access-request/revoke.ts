import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  try {
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Access request not found' });
    }

    if (request.status && request.status.toLowerCase() === 'approved') {
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'REVOKED' },
      });
      return res.status(200).json({ message: 'Approved access request revoked successfully' });
    } else {
      return res.status(400).json({ error: 'Can only revoke approved requests' });
    }
  } catch (error) {
    console.error('Error revoking access request:', error);
    return res.status(500).json({ error: 'Failed to revoke access request' });
  } finally {
    await prisma.$disconnect();
  }
} 