import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recordId } = req.body;
  if (!recordId) {
    return res.status(400).json({ error: 'Record ID is required' });
  }

  try {
    // First get the record to check ownership
    const record = await prisma.record.findUnique({
      where: { id: parseInt(recordId) },
      include: { user: true }
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Delete the record
    await prisma.record.delete({
      where: { id: parseInt(recordId) }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    return res.status(500).json({ error: 'Failed to delete record' });
  } finally {
    await prisma.$disconnect();
  }
} 