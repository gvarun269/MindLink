// backend/sockets/gameSocket.js

import {
  startGame,
  setPlayers,
  submitChoice,
  nextRound,
  getGameState,
} from "../gameManager.js";

const activeRooms = new Map();

export function registerSocketHandlers(io) {
  globalThis.io = io; // For use in timers
  io.on("connection", (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);

    // --- Create Room ---
    socket.on("create-room", ({ name, avatar }, callback) => {
      const roomCode = generateRoomCode();

      activeRooms.set(roomCode, {
        host: socket.id,
        players: [{ name, socketId: socket.id, avatar }],
      });

      socket.join(roomCode);
      console.log(`🏠 Room ${roomCode} created by ${name}`);
      callback({ success: true, roomCode });

      io.to(roomCode).emit("update-players", {
        players: activeRooms.get(roomCode).players,
        hostId: socket.id,
      });
    });

    // --- Join Room ---
    socket.on("join-room", ({ name, avatar, roomCode }, callback) => {
      const room = activeRooms.get(roomCode);
      if (!room) return callback({ success: false, message: "Room not found" });

      const nameExists = room.players.some((p) => p.name === name);
      if (nameExists) return callback({ success: false, message: "Name already taken" });

      room.players.push({ name, socketId: socket.id, avatar });
      socket.join(roomCode);
      console.log(`✅ ${name} joined room ${roomCode}`);
      callback({ success: true });

      io.to(roomCode).emit("update-players", {
        players: room.players,
        hostId: room.host,
      });
    });

    // --- Start Game ---
    socket.on("start-game", ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      const players = room.players;
      setPlayers(roomCode, players);

      const game = startGame(roomCode);
      if (!game) {
        io.to(roomCode).emit("game-error", { message: "Failed to start game." });
        return;
      }

      const { images, category } = game;
      io.to(roomCode).emit("game-started", {
        round: 1,
        images,
        category,
      });
    });

    // --- Submit Choice ---
    socket.on("submit-choice", ({ roomCode, name, image }) => {
      const isComplete = submitChoice(roomCode, name, image);

      if (isComplete) {
        const roomState = getGameState(roomCode);
        io.to(roomCode).emit("reveal-round", {
          trap: roomState.trap,
          choices: roomState.choices,
        });
      }
    });

    // --- Next Round ---
    socket.on("next-round", (roomCode) => {
      const result = nextRound(roomCode);
      if (!result) return;

      if (result.finished) {
        io.to(roomCode).emit("game-over", {
          scores: result.scores,
        });
      } else {
        io.to(roomCode).emit("new-round", {
          round: result.round,
          images: result.images,
          category: result.category,
        });
      }
    });

    // --- Debug Sync ---
    socket.on("get-state", (roomCode, cb) => {
      const state = getGameState(roomCode);
      cb(state);
    });

    // --- Disconnect Handler ---
    socket.on("disconnect", () => {
      console.log(`🔴 Disconnected: ${socket.id}`);

      for (let [roomCode, room] of activeRooms) {
        const updatedPlayers = room.players.filter((p) => p.socketId !== socket.id);

        if (updatedPlayers.length === 0) {
          activeRooms.delete(roomCode);
          console.log(`🗑️ Room ${roomCode} deleted (no players left)`);
        } else {
          room.players = updatedPlayers;
          io.to(roomCode).emit("update-players", {
            players: room.players,
            hostId: room.host,
          });
        }
      }
    });
  });
}

// 🔑 Unique Room Code Generator
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
