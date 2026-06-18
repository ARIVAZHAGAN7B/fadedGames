import { createServer } from "node:http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createApp } from "./app.js";
import { createCorsOriginChecker } from "./config/cors.js";
import { registerSocketHandlers } from "./socket/index.js";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 4000;
const allowOrigin = createCorsOriginChecker();
const app = createApp({ allowOrigin });

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowOrigin,
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Bingo server listening on port ${PORT}`);
});
