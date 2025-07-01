import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import "./Lobby.css";

export default function Lobby() {
  const [players, setPlayers] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const room = localStorage.getItem("roomCode");
    setRoomCode(room);

    socket.on("update-players", (playerList) => {
      if (Array.isArray(playerList)) {
        setPlayers(playerList);
      }
    });

    // ✅ Changed from "game-started" to "new-round"
    socket.on("new-round", ({ round, images, category }) => {
      localStorage.setItem("round", round);
      localStorage.setItem("images", JSON.stringify(images));
      localStorage.setItem("category", category);
      navigate("/game");
    });

    return () => {
      socket.off("update-players");
      socket.off("new-round"); // ✅ Clean up the new event
    };
  }, [navigate]);

  const handleStart = () => {
    socket.emit("start-game", {
      roomCode: roomCode,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hostId = players[0]?.socketId;
  const mySocketId = socket.id;

  const renderPlayers = () => {
    return players.map((p, idx) => (
      <div className={`player-card ${p.socketId === hostId ? "host" : ""}`} key={p.socketId || idx}>
        <div className="player-avatar">{p.avatar}</div>
        <div className="player-info">
          <span className="player-name">{p.name}</span>
          {p.socketId === hostId && <span className="host-badge">Host</span>}
        </div>
        {idx === 0 && <div className="crown-icon">👑</div>}
      </div>
    ));
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-bg-particles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="lobby-particle" />
        ))}
      </div>

      <div className="lobby-card">
        <div className="room-header">
          <h2 className="room-title">Room Code</h2>
          <div className="room-code-container" onClick={copyToClipboard}>
            <span className="room-code">{roomCode}</span>
            <span className="copy-indicator">{copied ? "✓ Copied!" : "📋 Copy"}</span>
          </div>
          <p className="room-subtext">Share this code with friends</p>
        </div>

        <div className="players-grid">{renderPlayers()}</div>

        {mySocketId === hostId ? (
          <button className="start-game-btn" onClick={handleStart}>
            <span className="btn-icon">🚀</span> Start Game
          </button>
        ) : (
          <div className="waiting-message">
            <div className="loading-spinner"></div>
            <p>Waiting for host to start...</p>
          </div>
        )}
      </div>
    </div>
  );
}
