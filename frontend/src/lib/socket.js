import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const socketUrl =
      API_BASE_URL ||
      (typeof window !== "undefined" &&
       (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://localhost:5000"
        : "http://13.203.210.175:5000");
    socket = io(socketUrl, {
      autoConnect: false,
      auth: (cb) => {
        const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        cb({ token });
      },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
