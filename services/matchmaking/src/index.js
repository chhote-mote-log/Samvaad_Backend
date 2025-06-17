"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const BackgroundWorker_1 = require("./services/BackgroundWorker");
const kafkaService_1 = require("./kafka/kafkaService");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4004;
app.use(express_1.default.json());
app.use("/matchmaking", matchRoutes_1.default);
// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "matchmaking" });
});
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect Kafka producer once
        yield kafkaService_1.KafkaService.producer.connect();
        console.log("✅ Kafka producer connected");
        // Start Background Worker
        BackgroundWorker_1.BackgroundWorker.start(); // runs every 5 seconds by default
        app.listen(PORT, () => {
            console.log(`🚀 Matchmaking Service running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start service:", error);
        process.exit(1);
    }
});
startServer();
// Graceful shutdown
process.on("SIGINT", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\n🛑 Shutting down gracefully...");
    yield kafkaService_1.KafkaService.producer.disconnect();
    process.exit(0);
}));
