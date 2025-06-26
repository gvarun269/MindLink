// src/utils/socket.js
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000"); // Change if deploying
