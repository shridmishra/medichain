import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { publicKey } = req.query;
  if (!publicKey || typeof publicKey !== 'string') {
    return res.status(400).json({ error: 'Public key is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { publicKey },
      include: {
        records: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let records = user.records;

    // If user is a doctor, also fetch records they have access to
    if (user.role === 'DOCTOR') {
      const approvedRequests = await prisma.accessRequest.findMany({
        where: {
          doctorId: user.id,
          status: 'approved',
        },
        include: {
          patient: {
            include: {
              records: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      // Add records from patients who have granted access
      const accessibleRecords = approvedRequests.flatMap(request => 
        request.patient.records.map(record => ({
          ...record,
          patient: {
            publicKey: request.patient.publicKey,
          },
        }))
      );

      records = [...records, ...accessibleRecords];
    }

    // Format records with additional information
    const formattedRecords = records.map(record => ({
      id: record.id.toString(),
      name: `Record ${record.id}`,
      createdAt: record.createdAt.toISOString(),
      uploadDate: record.createdAt.toISOString(),
      pointer: record.pointer,
      url: `https://ipfs.io/ipfs/${record.pointer}`,
    }));

    return res.status(200).json({ records: formattedRecords });
  } catch (error) {
    console.error('Error fetching records:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 