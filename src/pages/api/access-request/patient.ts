import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { patientPublicKey } = req.query;

    if (!patientPublicKey) {
      return res.status(400).json({ error: 'Patient public key is required' });
    }

    try {
      const patient = await prisma.user.findUnique({
        where: { publicKey: patientPublicKey as string },
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const requests = await prisma.accessRequest.findMany({
        where: {
          patientId: patient.id,
        },
        include: {
          doctor: {
            select: {
              publicKey: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ requests });
    } catch (error) {
      console.error('Error fetching access requests:', error);
      return res.status(500).json({ error: 'Failed to fetch access requests' });
    } finally {
      await prisma.$disconnect();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 