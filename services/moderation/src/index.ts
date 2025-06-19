// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import {httpRouter} from './ingestion/adapters/httpListener';
// import { startIngestionLayer } from './ingestion/ingestionController';
import { startModerationConsumer } from './kafka/consumer';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Register HTTP router
app.use('/api', httpRouter);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 AI Moderation Service running at http://localhost:${PORT}`);

  try {
    console.log('⏳ Starting ingestion layer...');
    // await startIngestionLayer();
    console.log('✅ Ingestion layer ready');

    console.log('⏳ Starting moderation pipeline...');
    await startModerationConsumer();
    console.log('✅ Moderation pipeline active');
  } catch (err) {
    console.error('❌ Failed to bootstrap AI Moderation Service:', err);
    process.exit(1);
  }
});
