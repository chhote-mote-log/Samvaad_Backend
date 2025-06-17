// kafka/producers.ts
import { kafkaProducer } from '../services/kafkaService';

export async function sendToMatchmakingQueue(userData: any) {
  await kafkaProducer.send({
    topic: 'matchmaking.request.queue',
    messages: [{ value: JSON.stringify(userData) }],
  });
}

export async function sendDebateStartedToSessionService(debateData: any) {
  await kafkaProducer.send({
    topic: 'debate.session.start',
    messages: [{ value: JSON.stringify(debateData) }],
  });
}
