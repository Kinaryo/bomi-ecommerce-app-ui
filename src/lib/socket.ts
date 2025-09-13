"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (idUser?: number) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      autoConnect: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ [Socket] connected:", socket?.id);
      if (idUser) {
        registerUser(idUser);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] disconnected:", reason);
    });
  } else {
    // kalau socket sudah ada tapi user login belakangan → register ulang
    if (idUser) {
      registerUser(idUser);
    }
  }
  return socket;
};

export const registerUser = (idUser: number) => {
  if (!socket) return;
  console.log("👉 emit registerUser ke backend dengan idUser:", idUser);
  socket.emit("registerUser", idUser);
};
