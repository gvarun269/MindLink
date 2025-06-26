// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; // Landing page
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import GameOver from "./pages/GameOver"; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/lobby" element={<Lobby />} />
         <Route path="/game" element={<Game />} />
         <Route path="/gameover" element={<GameOver />} /> 
      </Routes>
    </Router>
  );
}

export default App;
