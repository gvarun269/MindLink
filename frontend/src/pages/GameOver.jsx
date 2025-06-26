import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameOver.css";

export default function Gameover() {
  const [scores, setScores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const finalScores = JSON.parse(localStorage.getItem("finalScores")) || {};
    const scoreList = Object.entries(finalScores).map(([name, score]) => ({
      name,
      score,
    }));

    // Sort scores descending
    scoreList.sort((a, b) => b.score - a.score);
    setScores(scoreList);
  }, []);

  const handlePlayAgain = () => {
    navigate("/lobby");
  };

  const handleGoHome = () => {
    localStorage.removeItem("playerName");
    localStorage.removeItem("avatar");
    localStorage.removeItem("roomCode");
    localStorage.removeItem("finalScores");
    navigate("/");
  };

  return (
    <div className="gameover-container">
      <div className="gameover-content">
        <div className="trophy-animation">🏆</div>
        <h1 className="gameover-title">Game Results</h1>
        <p className="gameover-subtitle">The competition was fierce, but only one can be the champion!</p>

        <div className="leaderboard-container">
          <div className="leaderboard-header">
            <span className="header-rank">Rank</span>
            <span className="header-player">Player</span>
            <span className="header-score">Score</span>
          </div>

          <div className="leaderboard-list">
            {scores.map((player, index) => (
              <div 
                key={index} 
                className={`leaderboard-item ${index === 0 ? "first-place" : ""}`}
              >
                <div className="player-rank">
                  <span className="rank-number">{index + 1}</span>
                  {index === 0 && <div className="crown-icon">👑</div>}
                </div>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  {index === 0 && <span className="champion-badge">Champion</span>}
                </div>
                <div className="player-score">
                  <span className="score-value">{player.score}</span>
                  <span className="score-label">points</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button className="play-again-button" onClick={handlePlayAgain}>
            <span className="button-icon">🔄</span>
            <span className="button-text">Play Again</span>
          </button>
          <button className="home-button" onClick={handleGoHome}>
            <span className="button-icon">🏠</span>
            <span className="button-text">Return Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}