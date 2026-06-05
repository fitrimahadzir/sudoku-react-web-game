import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import { WebcastPushConnection } from "tiktok-live-connector";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  // Track active tiktok connections to avoid memory leaks
  const activeConnections = new Map<string, WebcastPushConnection>();

  app.use(express.json());

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Websocket connection for real-time live events
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentTiktokConnection: WebcastPushConnection | null = null;
    let currentUsername = "";

    socket.on("connect_tiktok", async (username: string) => {
      console.log(`Connecting to TikTok Live for: ${username}`);
      
      try {
        // Disconnect existing if any
        if (currentTiktokConnection) {
          currentTiktokConnection.disconnect();
          activeConnections.delete(currentUsername);
        }

        currentUsername = username;
        const signApiKey = process.env.TIKTOK_SIGN_API_KEY;
        const tiktokLiveConnection = new WebcastPushConnection(username, {
          processInitialData: false,
          enableExtendedGiftInfo: true,
          requestPollingIntervalMs: 2000,
          ...(signApiKey ? { signApiKey } : {}),
          clientParams: {
            "app_language": "en-US",
            "device_platform": "web"
          }
        });

        currentTiktokConnection = tiktokLiveConnection;
        activeConnections.set(username, tiktokLiveConnection);

        tiktokLiveConnection.on('chat', (data) => {
          socket.emit('tiktok_chat', {
            uniqueId: data.uniqueId,
            nickname: data.nickname,
            comment: data.comment,
            profilePictureUrl: data.profilePictureUrl
          });
        });

        tiktokLiveConnection.on('error', (err) => {
          console.error("TikTok connection error:", err);
          socket.emit('tiktok_error', err.message || "Error tracking Live stream. Please try again.");
        });

        tiktokLiveConnection.on('streamEnd', () => {
          socket.emit('tiktok_disconnected', "Stream ended");
          currentTiktokConnection = null;
          activeConnections.delete(username);
        });

        tiktokLiveConnection.on('disconnected', () => {
          socket.emit('tiktok_disconnected', "Disconnected from TikTok Live");
          currentTiktokConnection = null;
          activeConnections.delete(username);
        });

        const state = await tiktokLiveConnection.connect();
        console.log(`Connected to TikTok Live for room ID: ${state.roomId}`);
        socket.emit('tiktok_connected', { roomId: state.roomId, username });

      } catch (err: any) {
        console.error("Failed to connect to TikTok Live:", err);
        socket.emit('tiktok_error', err.message || "Failed to connect to TikTok Live");
        currentTiktokConnection = null;
        activeConnections.delete(username);
      }
    });

    socket.on("disconnect_tiktok", () => {
      if (currentTiktokConnection) {
        currentTiktokConnection.disconnect();
        activeConnections.delete(currentUsername);
        currentTiktokConnection = null;
        currentUsername = "";
        socket.emit('tiktok_disconnected', "Manually disconnected");
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (currentTiktokConnection) {
        currentTiktokConnection.disconnect();
        activeConnections.delete(currentUsername);
      }
    });
  });

  // Vite middleware for development
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
