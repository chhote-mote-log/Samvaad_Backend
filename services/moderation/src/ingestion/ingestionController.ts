// src/ingestion/ingestionController.ts
import { startKafkaIngestion } from './adapters/kafkaConsumer';
// Optional: import httpListener and wsListener here later

export async function startIngestionLayer() {
  await startKafkaIngestion();
  // await startHttpListener(); // Optional
  // await startWebSocketListener(); // Optional
}
