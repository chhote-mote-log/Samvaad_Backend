import { Request, Response } from 'express';
import * as debateService from '../services/debateService';
import logger from '../utils/logger';

export async function createDebate(req: Request, res: Response) {
  const debate = await debateService.createDebate(req.body);
  logger.info('Debate created');
  return res.status(201).json({ success: true, message: 'Debate created', data: debate });
}
export async function requestMatchmaking(req: Request, res: Response) {
    const user = req.body;
     if (!user || !user.userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
     await debateService.requestMatchmaking(user);
    logger.info(`Matchmaking requested for user: ${user.userId}`);

    return res.status(200).json({ success: true, message: 'Matchmaking request sent successfully' });
}
export async function getDebateById(req: Request, res: Response) {
  const debate = await debateService.getDebateById(req.params.id);
  if (!debate) return res.status(404).json({ success: false, message: 'Debate not found' });
  return res.json({ success: true, data: debate });
}

export async function startDebate(req: Request, res: Response) {
  const result = await debateService.startDebate(req.params.id);
  logger.info(`Debate started: ${req.params.id}`);
  return res.json({ success: true, message: 'Debate started', data: result });
}

export async function endDebate(req: Request, res: Response) {
  const result = await debateService.endDebate(req.params.id);
  logger.info(`Debate ended: ${req.params.id}`);
  return res.json({ success: true, message: 'Debate ended', data: result });
}

export async function updateDebateConfig(req: Request, res: Response) {
  const updated = await debateService.updateDebateConfig(req.params.id, req.body);
  logger.info(`Debate config updated: ${req.params.id}`);
  return res.json({ success: true, message: 'Config updated', data: updated });
}

export async function listDebates(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string | undefined;

  const debates = await debateService.listDebates(page, limit, status);
  return res.json({ success: true, data: debates });
}

export async function deleteDebate(req: Request, res: Response) {
  const result = await debateService.deleteDebate(req.params.id);
  logger.info(`Debate deleted: ${req.params.id}`);
  return res.json({ success: true, message: 'Debate deleted successfully', data: result });
}

export async function getDebatesByUser(req: Request, res: Response) {
  const { userId } = req.params;
  const debates = await debateService.getDebatesByUser(userId);
  return res.json({ success: true, data: debates });
}
