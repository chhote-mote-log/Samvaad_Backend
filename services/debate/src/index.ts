  import express from 'express';
  import http from 'http';
  import path from 'path';
  import { Server as SocketIOServer } from 'socket.io';
  import dotenv from 'dotenv';

  import debateRoutes from './route/debateRoutes';
  import { setupSocketHandlers } from './socketHandler/debateSocket';
  import { setupConsumers } from './kafka/consumer';
  import { initProducer } from './kafka/producer';

  dotenv.config();

  const app = express();
  const port = process.env.PORT || 4006;

  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/api', debateRoutes);

  // Health Check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // HTTP & Socket.IO server
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Setup socket event handlers
  setupSocketHandlers(io);

  // Startup
  async function startServer() {
    try {
      await initProducer(); 
      await setupConsumers(); 
      server.listen(port, () => {
        console.log(`🚀 Debate Session Service running on port ${port}`);
      });
    } catch (err) {
      console.error('❌ Failed to start Debate Session Service:', err);
      process.exit(1);
    }
  }

  startServer();

  // Graceful shutdown
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
