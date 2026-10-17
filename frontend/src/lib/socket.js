import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const socketUrl = isHttps
      ? "" // Use relative path on HTTPS to route through Vercel reverse proxy (/socket.io/*)
      : (import.meta.env.VITE_SOCKET_URL ||
         import.meta.env.VITE_API_URL ||
         (typeof window !== "undefined" &&
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
           ? "http://localhost:5000"
           : ""));
    socket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
