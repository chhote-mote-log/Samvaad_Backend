import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const getProfile = async (req: AuthenticatedRequest, res: Response):Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user){
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
};