import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/index.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 4000;
const configuredOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173,https://fadedgame.onrender.com")
  .split(",")
  .map((origin) => origin.trim());

const app = express();
app.use(cors({ origin: configuredOrigins }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "bingo-server" });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: configuredOrigins,
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Bingo server listening on port ${PORT}`);
});

