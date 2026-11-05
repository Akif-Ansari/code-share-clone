// src/sockets/collabSocket.js
import { pasteStore } from "../store/index.js";

/**
 * Setup Socket.IO for real-time collaborative code editing.
 * Handles room joining, live typing synchronization, title syncing,
 * and active user counting bidirectionally.
 */
export function setupSocketIO(io) {
  io.on("connection", (socket) => {
    let currentRoom = null;

    // Helper to broadcast room size safely to all clients in room
    const broadcastRoomUsers = (roomId) => {
      if (!roomId) return;
      const room = io.sockets.adapter.rooms.get(roomId);
      const count = room ? room.size : 0;
      io.to(roomId).emit("users-count", { count });
    };

    // Join collaborative room for a specific paste
    socket.on("join-room", async (rawPasteId) => {
      if (!rawPasteId) return;
      const pasteId = String(rawPasteId)
        .trim()
        .replace(/^\/+|\/+$/g, "")
        .split("/")
        .pop();
      if (!pasteId) return;

      // Leave previous room if changing rooms
      if (currentRoom && currentRoom !== pasteId) {
        socket.leave(currentRoom);
        broadcastRoomUsers(currentRoom);
      }

      currentRoom = pasteId;
      socket.data.room = pasteId;
      await socket.join(pasteId);

      try {
        // Fetch existing paste or create a new one if it doesn't exist
        let paste = await pasteStore.findById(pasteId);
        if (!paste) {
          paste = {
            id: pasteId,
            title: "Untitled Snippet",
            content: "",
            language: "plaintext",
            createdAt: new Date().toISOString(),
            expiresAt: null,
            burnAfterRead: false,
            views: 0,
          };
          await pasteStore.create(paste);
        }

        // Send initial document state to the joining user
        socket.emit("init-document", {
          id: paste.id,
          title: paste.title || "Untitled Snippet",
          content: paste.content || "",
        });

        // Broadcast updated room user count to all users in the room
        broadcastRoomUsers(pasteId);
      } catch (err) {
        console.error("Error initializing document for socket:", err);
      }
    });

    // Real-time live code changes
    socket.on("code-change", async (data) => {
      if (!data) return;
      const roomId = data.pasteId || currentRoom || socket.data.room;
      if (!roomId) return;
      const content = typeof data === "string" ? data : (data.content ?? "");

      // Ensure socket is registered in the room
      if (!socket.rooms.has(roomId)) {
        await socket.join(roomId);
      }

      // Broadcast to other users in the same room bidirectionally
      socket.to(roomId).emit("code-update", { content });

      // Save to store asynchronously
      pasteStore.update(roomId, { content }).catch((err) => {
        console.error("Error saving live code update:", err);
      });
    });

    // Title change
    socket.on("title-change", async (data) => {
      if (!data) return;
      const roomId = data.pasteId || currentRoom || socket.data.room;
      if (!roomId) return;
      const title = data.title || "Untitled Snippet";

      socket.to(roomId).emit("title-update", { title });

      pasteStore.update(roomId, { title }).catch((err) => {
        console.error("Error saving title update:", err);
      });
    });

    // User leaves / disconnects
    socket.on("disconnect", () => {
      if (currentRoom) {
        broadcastRoomUsers(currentRoom);
      }
    });
  });
}
