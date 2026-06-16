import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/index.js";

const PORT = process.env.PORT || 4000;
const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const configuredOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim())
  : defaultOrigins;

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

