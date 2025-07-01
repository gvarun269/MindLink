// backend/sockets/gameSocket.js
import {
  setPlayers,
  submitChoice,
  nextRound,
  getGameState,
} from "../gameManager.js";

const activeRooms = new Map();

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🟢 Client connected: ${socket.id}`);

    // --- Create Room ---
    socket.on("create-room", ({ name, avatar }, callback) => {
      const roomCode = generateRoomCode();
      activeRooms.set(roomCode, {
        host: socket.id,
        players: [{ name, socketId: socket.id, avatar }]
      });

      socket.join(roomCode);
      console.log(`🏠 Room ${roomCode} created by ${name}`);
      callback({ success: true, roomCode });
      io.to(roomCode).emit("update-players", activeRooms.get(roomCode).players);
    });

    // --- Join Room ---
    socket.on("join-room", ({ name, avatar, roomCode }, callback) => {
      const room = activeRooms.get(roomCode);
      if (!room) return callback({ success: false, message: "Room not found" });

      const nameExists = room.players.some(p => p.name === name);
      if (nameExists) return callback({ success: false, message: "Name already taken" });

      room.players.push({ name, socketId: socket.id, avatar });
      socket.join(roomCode);
      console.log(`✅ ${name} joined room ${roomCode}`);
      callback({ success: true });
      io.to(roomCode).emit("update-players", room.players);
    });

    // --- Start Game ---
    socket.on("start-game", ({ roomCode }) => {
      const room = activeRooms.get(roomCode);
      if (!room) return;

      // 1. Set players in gameManager
      const players = room.players;
      setPlayers(roomCode, players);

      // 2. Start first round directly using nextRound()
      const result = nextRound(roomCode);
      if (!result) {
        io.to(roomCode).emit("game-error", { message: "Failed to start game." });
        return;
      }

      // 3. Emit new-round to all players
      io.to(roomCode).emit("new-round", {
        round: result.round,
        images: result.images,
        category: result.category,
      });
    });

    // --- Player submits choice ---
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

    // --- Move to next round ---
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

    // --- Get game state (debug / sync) ---
    socket.on("get-state", (roomCode, cb) => {
      const state = getGameState(roomCode);
      cb(state);
    });

    // --- Handle disconnect ---
    socket.on("disconnect", () => {
      console.log(`🔴 Disconnected: ${socket.id}`);
      for (let [roomCode, room] of activeRooms) {
        const updatedPlayers = room.players.filter(p => p.socketId !== socket.id);
        if (updatedPlayers.length === 0) {
          activeRooms.delete(roomCode);
          console.log(`🗑️ Room ${roomCode} deleted (no players left)`);
        } else {
          room.players = updatedPlayers;
          io.to(roomCode).emit("update-players", room.players);
        }
      }
    });
  });
}

// --- Utility: Unique Room Code Generator ---
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
