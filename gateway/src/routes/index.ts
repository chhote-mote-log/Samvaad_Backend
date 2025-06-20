import express from 'express';
import { proxyTo } from '../services/proxy';
import { verifyToken } from '../middleware/verifyToken';
import { SERVICES } from '../config/services';

const router = express.Router();

// Public
router.use('/api/auth', proxyTo(SERVICES.AUTH));

// Protected
router.use('/api/debate', verifyToken, proxyTo(SERVICES.DEBATE));
router.use('/api/match', verifyToken, proxyTo(SERVICES.MATCHMAKING));
router.use('/api/moderation', verifyToken, proxyTo(SERVICES.MODERATION));
router.use('/api/notify', verifyToken, proxyTo(SERVICES.NOTIFICATION));

export default router;
