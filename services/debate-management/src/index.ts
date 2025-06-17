// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import debateRoutes from './routes/debateRoutes';
import { setupConsumers } from './kafka/consumer';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/debates', debateRoutes);

const PORT = process.env.PORT || 4002;

async function start() {
  // Start Kafka Consumers
  await setupConsumers();

  // Start Express Server
  app.listen(PORT, () => {
    console.log(`🚀 Debate Management Service running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start Debate Management Service:", err);
});
