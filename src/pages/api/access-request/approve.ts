import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, status } = req.body;
  if (!requestId || !status || !['approved', 'denied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    const accessRequest = await prisma.accessRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        doctor: {
          select: {
            publicKey: true,
          },
        },
        patient: {
          select: {
            publicKey: true,
          },
        },
      },
    });

    return res.status(200).json({ accessRequest });
  } catch (error) {
    console.error('Error updating access request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 