// src/ingestion/adapters/httpListener.ts
import {Request,Response} from 'express';
import express from 'express';
import { validateMessage } from '../validator/validator';
import { checkRateLimit } from '../rateLimiter/rateLimiter';
import { bufferMessage } from '../buffering/bufferManager';

const router = express.Router();

router.post('/ingest', async (req:Request, res:Response) => {
  const { value, error } = validateMessage(req.body);

  if (error){
   res.status(400).json({ error });
   return;
  }

  const isAllowed = await checkRateLimit(value!.userId);
  if (!isAllowed){
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  bufferMessage(value!);  
   res.status(200).json({ status: 'Buffered' });
   return;
});

export const httpRouter = router;
