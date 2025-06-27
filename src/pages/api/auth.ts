import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { publicKey, role: requestedRole } = req.body as { publicKey?: string; role?: Role };

  if (!publicKey) {
    console.error('[API/AUTH] No publicKey provided');
    return res.status(400).json({ error: 'Public key is required' });
  }

  if (requestedRole && !Object.values(Role).includes(requestedRole)) {
    console.error('[API/AUTH] Invalid role provided:', requestedRole);
    return res.status(400).json({ error: 'Invalid role provided' });
  }

  try {
    let user = await prisma.user.findUnique({ where: { publicKey } });
    let needsRole = false;

    if (!user) {
      // User does not exist, create them
      user = await prisma.user.create({
        data: {
          publicKey,
          // Role defaults to PATIENT via Prisma schema if requestedRole is not provided here
          // If RoleSelectionModal sends a role, it will be used.
          role: requestedRole || Role.PATIENT, 
        },
      });
      console.log('[API/AUTH] New user created:', user);
      // For a brand new user, even if defaulted to PATIENT, trigger modal for explicit choice/confirmation.
      needsRole = true; 
    } else {
      // User exists
      if (requestedRole && user.role !== requestedRole) {
        // A valid role was provided, and it's different from the current one, so update it.
        user = await prisma.user.update({
          where: { publicKey },
          data: { role: requestedRole },
        });
        console.log('[API/AUTH] User role updated:', user);
        needsRole = false; // Role has just been explicitly set/updated.
      } else if (!requestedRole && !user.role) {
        // User exists but somehow has no role (should be rare with schema defaults) and no role was passed to set one.
        console.log('[API/AUTH] User exists but has no role, prompting selection.');
        needsRole = true;
      } else {
        // User exists, has a role, and no (new) role was requested for update.
        // needsRole remains false by default.
        console.log('[API/AUTH] Existing user found:', user);
      }
    }

    console.log('[API/AUTH] Returning response:', { user, needsRole });
    return res.status(200).json({ user, needsRole });

  } catch (error) {
    console.error('[API/AUTH] Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}