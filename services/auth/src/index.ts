import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { json } from 'body-parser';
import authRoutes from './route/authRoutes';
import userRoutes from './route/userRoute';
import { kafkaConsumer } from './services/kafka/kafkaConsumer';
import { connectProducer } from './services/kafka/kafkaProducer';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(json());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

const startServer = async () => {
  try {
    // Connect producer and consumer before starting server
    console.log('Kafka producer connected successfully');
    await connectProducer();
    await kafkaConsumer();

    app.listen(4000, () => {
      console.log('Auth service running on port 4000');
    });
  } catch (error) {
    console.error('Failed to start service due to Kafka connection error', error);
    process.exit(1);
  }
};

startServer();
