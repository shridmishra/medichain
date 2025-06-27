import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { doctorPublicKey } = req.query;

    if (!doctorPublicKey) {
      return res.status(400).json({ error: 'Doctor public key is required' });
    }

    try {
      const doctor = await prisma.user.findUnique({
        where: { publicKey: doctorPublicKey as string },
      });

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      const requests = await prisma.accessRequest.findMany({
        where: {
          doctorId: doctor.id,
        },
        include: {
          patient: {
            select: {
              publicKey: true,
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

  if (req.method === 'POST') {
    const { doctorPublicKey, patientPublicKey } = req.body;

    if (!doctorPublicKey || !patientPublicKey) {
      return res.status(400).json({ error: 'Doctor and patient public keys are required' });
    }

    try {
      const [doctor, patient] = await Promise.all([
        prisma.user.findUnique({ where: { publicKey: doctorPublicKey } }),
        prisma.user.findUnique({ where: { publicKey: patientPublicKey } }),
      ]);

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Check if request already exists
      const existingRequest = await prisma.accessRequest.findFirst({
        where: {
          doctorId: doctor.id,
          patientId: patient.id,
          status: 'PENDING',
        },
      });

      if (existingRequest) {
        return res.status(400).json({ error: 'Access request already exists' });
      }

      const request = await prisma.accessRequest.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          status: 'PENDING',
        },
        include: {
          patient: {
            select: {
              publicKey: true,
            },
          },
        },
      });

      return res.status(200).json({ request });
    } catch (error) {
      console.error('Error creating access request:', error);
      return res.status(500).json({ error: 'Failed to create access request' });
    } finally {
      await prisma.$disconnect();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 