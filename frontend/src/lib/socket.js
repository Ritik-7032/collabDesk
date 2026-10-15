import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
