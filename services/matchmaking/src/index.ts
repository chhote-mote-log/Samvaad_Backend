import express from "express";
import dotenv from "dotenv";
import matchRoutes from "./routes/matchRoutes";
import { BackgroundWorker } from "./services/BackgroundWorker";
import { KafkaService } from "./kafka/kafkaService";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4004;

app.use(express.json());
app.use("/matchmaking", matchRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "matchmaking" });
});

// Start server
const startServer = async () => {
  try {
    // Connect Kafka producer once
    await KafkaService.producer.connect();
    console.log("✅ Kafka producer connected");

    // Start Background Worker
    BackgroundWorker.start(); // runs every 5 seconds by default

    app.listen(PORT, () => {
      console.log(`🚀 Matchmaking Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start service:", error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await KafkaService.producer.disconnect();
  process.exit(0);
});
