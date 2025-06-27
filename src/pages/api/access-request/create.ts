import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { doctorPublicKey, patientPublicKey } = req.body;
  if (!doctorPublicKey || !patientPublicKey) {
    return res.status(400).json({ error: 'Doctor and patient public keys are required' });
  }

  try {
    // Find doctor and patient
    const [doctor, patient] = await Promise.all([
      prisma.user.findUnique({ where: { publicKey: doctorPublicKey } }),
      prisma.user.findUnique({ where: { publicKey: patientPublicKey } }),
    ]);

    if (!doctor || !patient) {
      return res.status(404).json({ error: 'Doctor or patient not found' });
    }

    // Check if doctor already has a pending or approved request (not revoked)
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: patient.id,
        OR: [
          { status: 'pending' },
          { status: 'approved' },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ error: 'Access request already pending' });
      } else if (existingRequest.status === 'approved') {
        return res.status(400).json({ error: 'Doctor already has access' });
      }
    }

    // Create new access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
      },
    });

    return res.status(200).json({ accessRequest });
  } catch (error) {
    console.error('Error creating access request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
} 