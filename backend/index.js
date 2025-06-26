import express from "express";
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./sockets/gameSocket.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ✅ Define global after 'io' is created
globalThis.io = io;

// Setup sockets
registerSocketHandlers(io);

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
