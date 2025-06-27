import path from "path";
import fs from "fs";

// 👥 Active game state per room
const gameRooms = new Map();

// 🗂️ List of available categories (case-sensitive to folder names!)
const availableCategories = [
  "Animals", "Cars", "Fruits", "Movies", "Places",
  "Teams", "Players", "Foods", "Sports", "Cartoons"
];

// 📸 Random image selection from assets
function getRandomImages(category, count) {
  const categoryPath = path.join("assets", category);
  const allImages = fs.readdirSync(categoryPath).filter(f => f.endsWith(".jpg") || f.endsWith(".png"));
  const shuffled = allImages.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 💣 Pick trap image
function pickTrap(images) {
  return images[Math.floor(Math.random() * images.length)];
}

// 🔁 Get unused category
function getNextCategory(used) {
  const unused = availableCategories.filter(cat => !used.includes(cat));
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

// 🚀 Start new game
export function startGame(roomCode) {
  const category = getNextCategory([]);
  if (!category) return null;

  const allImages = getRandomImages(category, 6);
  if (!allImages || allImages.length < 4) return null;

  const selectedImages = allImages.slice(0, 4);
  const trap = pickTrap(selectedImages);

  gameRooms.set(roomCode, {
    round: 1,
    players: [],
    usedCategories: [category],
    category,
    images: selectedImages,
    trap,
    choices: {},
    scores: {},
    revealedChoices: [],
    finished: false
  });

  startTimer(roomCode); // ⏱️ Start first timer

  return {
    images: selectedImages,
    category,
    trap: null
  };
}

// 👤 Set players & initialize scores
export function setPlayers(roomCode, players) {
  const room = gameRooms.get(roomCode);
  if (room) {
    room.players = players;
    players.forEach(p => {
      room.scores[p.name] = 0;
    });
  }
}

// 📥 On player choice
export function submitChoice(roomCode, playerName, imageName) {
  const room = gameRooms.get(roomCode);
  if (!room || room.finished) return;

  room.choices[playerName] = imageName;

  // All players have chosen
  if (Object.keys(room.choices).length === room.players.length) {
    clearTimeout(room.timer);
    calculateRoundScore(roomCode);
    return true;
  }

  return false;
}

// 🧠 Scoring logic
function calculateRoundScore(roomCode) {
  const room = gameRooms.get(roomCode);
  if (!room) return;

  const choiceMap = {};
  for (let [player, image] of Object.entries(room.choices)) {
    if (!choiceMap[image]) choiceMap[image] = [];
    choiceMap[image].push(player);
  }

  for (let [image, players] of Object.entries(choiceMap)) {
    for (let player of players) {
      if (image === room.trap) {
        room.scores[player] -= 1;
      } else if (players.length > 1) {
        room.scores[player] += players.length;
      }
    }
  }

  room.revealedChoices = Object.keys(choiceMap);
}

// ⏭️ Go to next round
export function nextRound(roomCode) {
  const room = gameRooms.get(roomCode);
  if (!room || room.finished) return null;

  if (room.round >= 10) {
    room.finished = true;
    return { finished: true, scores: room.scores };
  }

  const nextCategory = getNextCategory(room.usedCategories);
  if (!nextCategory) {
    room.finished = true;
    return { finished: true, scores: room.scores };
  }

  const allImages = getRandomImages(nextCategory, 6);
  const selectedImages = allImages.slice(0, 4);
  const trap = pickTrap(selectedImages);

  room.round++;
  room.category = nextCategory;
  room.images = selectedImages;
  room.trap = trap;
  room.usedCategories.push(nextCategory);
  room.choices = {};
  room.revealedChoices = [];

  startTimer(roomCode);

  return {
    round: room.round,
    images: selectedImages,
    category: nextCategory,
    trap: null
  };
}

// ⏱️ Fallback timer (auto select after 15s)
function startTimer(roomCode) {
  const room = gameRooms.get(roomCode);
  if (!room) return;

  room.timer = setTimeout(() => {
    const pending = room.players.filter(p => !room.choices[p.name]);
    for (let p of pending) {
      const randImage = room.images[Math.floor(Math.random() * room.images.length)];
      room.choices[p.name] = randImage;
    }

    calculateRoundScore(roomCode);

    const io = globalThis.io;
    io.to(roomCode).emit("reveal-round", {
      trap: room.trap,
      choices: room.revealedChoices
    });
  }, 15000);
}

// 📊 Get game state
export function getGameState(roomCode) {
  const room = gameRooms.get(roomCode);
  if (!room) return null;

  return {
    round: room.round,
    category: room.category,
    images: room.images,
    trap: room.trap,
    scores: room.scores,
    choices: room.revealedChoices,
    finished: room.finished
  };
}
