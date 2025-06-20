import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from "http"
import router from './routes';
import { rateLimiter } from './middleware/rateLimiter';
import { socketProxy } from './services/socketProxy';

dotenv.config();
const app = express();
const server = http.createServer(app);


app.use(cors());
app.use(rateLimiter);
app.use(router);

server.on('upgrade', socketProxy.upgrade!);

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`🚀 API Gateway running on port ${PORT}`));
