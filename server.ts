import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Game state
  const players: Record<string, any> = {};
  const drones: Record<string, any> = {};

  // Initialize some drones
  for (let i = 0; i < 5; i++) {
    const id = `drone_${i}`;
    drones[id] = {
      id,
      position: [Math.random() * 40 - 20, 2 + Math.random() * 5, Math.random() * 40 - 20],
      health: 50,
    };
  }

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Initialize player
    players[socket.id] = {
      id: socket.id,
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      team: Math.random() > 0.5 ? "Red" : "Blue",
      health: 100,
      score: 0,
    };

    // Send initial state to the new player
    socket.emit("init", { id: socket.id, players, drones });

    // Notify others
    socket.broadcast.emit("player:joined", players[socket.id]);

    socket.on("move", (data) => {
      if (players[socket.id]) {
        players[socket.id].position = data.position;
        players[socket.id].rotation = data.rotation;
        socket.broadcast.emit("player:moved", {
          id: socket.id,
          position: data.position,
          rotation: data.rotation,
        });
      }
    });

    socket.on("shoot", (data) => {
      // Broadcast laser shot to all players
      io.emit("laser:fired", {
        ownerId: socket.id,
        origin: data.origin,
        direction: data.direction,
      });
    });

    socket.on("hit", (data) => {
      const targetId = data.targetId;
      
      // Handle Player Hit
      if (players[targetId]) {
        players[targetId].health -= 10;
        if (players[targetId].health <= 0) {
          players[targetId].health = 100;
          players[targetId].position = [
            Math.random() * 30 - 15,
            5,
            Math.random() * 30 - 15,
          ];
          
          players[socket.id].score += 100;
          
          io.emit("player:respawned", {
            id: targetId,
            position: players[targetId].position,
            killerId: socket.id,
            killerScore: players[socket.id].score
          });
        } else {
          io.emit("player:hit", {
            id: targetId,
            health: players[targetId].health,
            attackerId: socket.id,
          });
        }
      } 
      // Handle Drone Hit
      else if (drones[targetId]) {
        drones[targetId].health -= 25;
        if (drones[targetId].health <= 0) {
          drones[targetId].health = 50;
          drones[targetId].position = [
            Math.random() * 40 - 20,
            2 + Math.random() * 5,
            Math.random() * 40 - 20,
          ];
          
          if (players[socket.id]) {
            players[socket.id].score += 50;
            io.emit("drone:respawned", {
              id: targetId,
              position: drones[targetId].position,
              killerId: socket.id,
              killerScore: players[socket.id].score
            });
          }
        } else {
          io.emit("drone:hit", { id: targetId, health: drones[targetId].health });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      delete players[socket.id];
      io.emit("player:left", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
