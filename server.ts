import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import { SocketServer } from "./src/websocket/socket-server";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const socketServer = new SocketServer(io);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socketServer.attach(socket);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
