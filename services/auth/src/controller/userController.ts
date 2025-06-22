import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import bcrypt from 'bcrypt'
interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const getMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, username: true, full_name: true, bio: true, avatar_url: true,
      gender: true, dob: true, country: true, language: true, level: true, rank: true,
      elo_rating: true, xp: true, total_debates: true, wins: true, losses: true,
      preferred_modes: true, preferred_types: true, notification_settings: true,
      ai_feedback_enabled: true, created_at: true, updated_at: true
    }
  });

  if (!user){
     res.status(404).json({ error: "User not found" });
     return;
  } 
  res.json(user);
  return;
};
export const updateMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { bio, gender, dob, country, language, full_name } = req.body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { bio, gender, dob, country, language, full_name, updated_at: new Date() }
  });

  res.json({ message: "Profile updated", user: updated });
};

export const changePassword = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.password_hash){
    res.status(400).json({ error: "Password not set" });
    return;
  } 

  const match = await bcrypt.compare(oldPassword, user.password_hash);
  if (!match){
    res.status(401).json({ error: "Incorrect current password" });
    return;
  } 

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password_hash: newHash } });

  res.json({ message: "Password changed successfully" });
  return;
};

export const getPublicProfile = async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      full_name: true,
      avatar_url: true,
      bio: true,
      level: true,
      rank: true,
      elo_rating: true,
      total_debates: true,
      wins: true,
      losses: true,
    }
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
    
  res.json(user);
  return;
};




export const updatePreferences = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { preferred_modes, preferred_types } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { preferred_modes, preferred_types }
  });

  res.json({ message: "Preferences updated", user });
};


export const updateNotificationSettings = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { notification_settings, ai_feedback_enabled } = req.body;

  await prisma.user.update({
    where: { id: userId },
    data: { notification_settings, ai_feedback_enabled }
  });

  res.json({ message: "Settings updated" });
};


