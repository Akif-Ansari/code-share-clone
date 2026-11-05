// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import apiRoutes from "./src/routes/apiRoutes.js";
import viewRoutes from "./src/routes/viewRoutes.js";
import { pasteStore } from "./src/store/index.js";
import { setupSocketIO } from "./src/sockets/collabSocket.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files (CSS, JS, assets)
app.use(express.static(path.resolve(process.cwd(), "view"), { index: false }));

// Setup Socket.IO for live collaborative code editing
setupSocketIO(io);

// API and View Routes
app.use("/api", apiRoutes);
app.use("/", viewRoutes);

// Periodic cleanup of expired pastes (every 10 minutes)
if (typeof pasteStore.cleanupExpired === "function") {
  setInterval(async () => {
    try {
      const removed = await pasteStore.cleanupExpired();
      if (removed > 0) {
        console.log(`[Store] Cleaned up ${removed} expired paste(s).`);
      }
    } catch (e) {
      console.error("[Store] Cleanup error:", e);
    }
  }, 10 * 60 * 1000);
}

// 404 Handler for undefined API or web routes
app.use((req, res) => {
  if (req.accepts("html")) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>404 Not Found</title></head>
        <body style="background:#000000;color:#ffffff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;">
          <h1 style="font-size:3rem;margin-bottom:0.5rem;font-weight:700;">404</h1>
          <p style="color:#a1a1aa;margin-bottom:1.5rem;">Page or Snippet not found.</p>
          <a href="/" style="color:#000000;background:#ffffff;text-decoration:none;border:1px solid #ffffff;padding:8px 16px;border-radius:6px;font-weight:600;">Start New Session</a>
        </body>
      </html>
    `);
  }
  return res.status(404).json({ error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`🚀 CodeShare live server running at http://localhost:${PORT}`);
});
