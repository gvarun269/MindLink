// src/pages/Home.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Home.css";
import { socket } from "../utils/socket";

const avatars = ["🐵", "🐱", "🦊", "🐸", "🐼", "🐯"];

export default function Home() {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [roomCode, setRoomCode] = useState("");
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!name.trim()) return alert("Please enter your name");

    socket.emit("create-room", { name, avatar }, ({ success, roomCode }) => {
      if (success) {
        localStorage.setItem("playerName", name);
        localStorage.setItem("avatar", avatar);
        localStorage.setItem("roomCode", roomCode);
        navigate("/lobby");
      } else {
        alert("Failed to create room");
      }
    });
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim())
      return alert("Enter both your name and room code");

    socket.emit("join-room", { name, avatar, roomCode: roomCode.toUpperCase() }, ({ success, message }) => {
      if (success) {
        localStorage.setItem("playerName", name);
        localStorage.setItem("avatar", avatar);
        localStorage.setItem("roomCode", roomCode.toUpperCase());
        navigate("/lobby");
      } else {
        alert(message || "Failed to join room");
      }
    });
  };

  return (
    <div className="mobile-container">
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      <motion.div 
        className="game-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="game-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          🎮 MindLink
        </motion.h1>

        <div className="form-group">
          <input
            type="text"
            placeholder="Your Name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <h3 className="section-label">Choose Avatar</h3>
        <div className="avatar-grid">
          {avatars.map((a, i) => (
            <button
              key={i}
              className={`avatar-option ${avatar === a ? "active" : ""}`}
              onClick={() => setAvatar(a)}
            >
              <span className="avatar-emoji">{a}</span>
            </button>
          ))}
        </div>

        <div className="action-buttons">
          <button className="primary-btn" onClick={handleCreate}>
            <span className="btn-icon">🚀</span> Create Room
          </button>

          <div className="divider-line">
            <span>OR</span>
          </div>

          <input
            type="text"
            placeholder="Room Code"
            className="form-input"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <button className="secondary-btn" onClick={handleJoin}>
            <span className="btn-icon">🔗</span> Join Room
          </button>
        </div>

        <button 
          className="rules-toggle"
          onClick={() => setShowRules(!showRules)}
        >
          {showRules ? "Hide Rules" : "Show Rules"}
        </button>

        {showRules && (
          <div className="rules-panel">
            <h3>🧠 How to Play</h3>
            <div className="rules-content">
              <p>1. Create or join a room</p>
              <p>2. Invite friends using room code</p>
              <p>3. 2–8 players per room</p>
              <p>4. Game has 5 rounds with random categories</p>
              <p>5. Each round: choose one of four images</p>
              <p>6. Score = how many people picked same image</p>
              <p>7. One image is a trap (−1 point if chosen)</p>
              <p>8. Final winner shown in leaderboard after round 5</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

