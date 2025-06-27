import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import "./Game.css";

export default function Game() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(10);
  const [round, setRound] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [trap, setTrap] = useState(null);
  const [choices, setChoices] = useState({});
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  const roomCode = localStorage.getItem("roomCode");
  const playerName = localStorage.getItem("playerName");

  const handleSelect = useCallback(
    (img) => {
      if (selected || reveal) return;
      setSelected(img);
      socket.emit("submit-choice", {
        roomCode,
        name: playerName,
        image: img,
      });
    },
    [selected, reveal, roomCode, playerName]
  );

  // Socket Events
  useEffect(() => {
    socket.on("game-started", ({ round, images, category }) => {
      setRound(round);
      setImages(images.slice(0, 4));
      setCategory(category);
      setReveal(false);
      setSelected(null);
      setTimer(2);
    });

    socket.on("new-round", ({ round, images, category }) => {
      setRound(round);
      setImages(images.slice(0, 4));
      setCategory(category);
      setReveal(false);
      setSelected(null);
      setTimer(15);
    });

    socket.on("reveal-round", ({ trap, choices }) => {
      setTrap(trap);
      setChoices(choices);
      setReveal(true);
    });

    socket.on("game-over", ({ scores }) => {
      localStorage.setItem("finalScores", JSON.stringify(scores));
      navigate("/gameover");
    });

    return () => {
      socket.off("game-started");
      socket.off("new-round");
      socket.off("reveal-round");
      socket.off("game-over");
    };
  }, [navigate, handleSelect]);

  // Timer & Auto-select
  useEffect(() => {
    if (reveal || selected) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!selected && images.length > 0) {
            const random = images[Math.floor(Math.random() * images.length)];
            handleSelect(random);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [reveal, selected, images, handleSelect]);

  const handleNext = () => {
    socket.emit("next-round", roomCode);
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="progress-tracker">
          <div className="round-indicator">
            <span className="round-number">{round}</span>
            <span className="round-label">/ 10 ROUND</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(round / 5) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="game-info">
          <div className="category-chip">
            <span className="category-icon">📂</span>
            <span className="category-name">{category?.toUpperCase()}</span>
          </div>
          
          <div className={`timer-display ${timer <= 5 ? "warning" : ""}`}>
            <div className="timer-icon">⏱️</div>
            <div className="timer-value">{timer}s</div>
          </div>
        </div>
      </div>

      <div className="image-grid">
        {images.map((img, i) => (
          <div
            key={i}
            className={`image-card 
              ${selected === img ? "selected" : ""}
              ${reveal && trap === img ? "trap" : ""}
            `}
            onClick={() => handleSelect(img)}
          >
            <div className="image-wrapper">
              <img src={`/assets/${category}/${img}`} alt={`choice-${i}`} />
              {selected === img && (
                <div className="selection-badge">YOUR PICK</div>
              )}
              {reveal && trap === img && (
                <div className="trap-overlay">
                  <div className="trap-icon">💣</div>
                  <div className="trap-label">TRAP!</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {reveal && (
        <div className="reveal-panel">
          <div className="reveal-header">
            <h3>Player Choices</h3>
            <div className="choices-list">
              {Object.entries(choices).map(([player, img], idx) => (
                <div key={idx} className="choice-item">
                  <span className="player-icon">👤</span>
                  <span className="player-choice">
                    {player === playerName ? "You" : "Someone"} picked: {img.replace(/\.[^/.]+$/, "")}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button className="next-round-btn" onClick={handleNext}>
            <span>Continue to Round {round + 1}</span>
            <span className="arrow-icon">→</span>
          </button>
        </div>
      )}
    </div>
  );
}