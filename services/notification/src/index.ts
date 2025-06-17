import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import bodyParser from "body-parser";

import fcmTokenRoutes from "./api/routes/fcmtokenRoutes";
import notificationRoutes from "./api/routes/notificationRoutes";

import { startKafkaConsumer } from "./consumers/kafkaConsumer";
import { registerSocket } from "./services/webSocketManager";

const app = express();
app.use(bodyParser.json());

app.use("/api", fcmTokenRoutes);
app.use("/api/notifications", notificationRoutes);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",  // Adjust this for your frontend origin for security
  },
});

io.on("connection", (socket) => {
  socket.on("register", (userId: string) => {
    registerSocket(userId, socket);
    console.log(`User connected with id: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 4002;
server.listen(PORT, async () => {
  console.log(`Notification service running on port ${PORT}`);
  await startKafkaConsumer();
});
