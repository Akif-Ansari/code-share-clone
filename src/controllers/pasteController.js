// src/controllers/pasteController.js
import { nanoid } from "nanoid";
import { pasteStore } from "../store/index.js";

export const pasteController = {
  /**
   * POST /api/pastes
   * Create a new snippet
   */
  async createPaste(req, res) {
    try {
      const { title, content, language, expiresInMinutes, burnAfterRead } = req.body;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Code content cannot be empty." });
      }

      const id = nanoid(8);
      const now = new Date();
      const expiresMin = Number(expiresInMinutes);
      const expiresAt = expiresMin > 0 ? new Date(now.getTime() + expiresMin * 60000) : null;

      const newPaste = {
        id,
        title: (title && title.trim()) ? title.trim() : "Untitled Snippet",
        content,
        language: (language && language.trim()) ? language.trim().toLowerCase() : "plaintext",
        createdAt: now.toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        burnAfterRead: Boolean(burnAfterRead),
        views: 0,
      };

      await pasteStore.create(newPaste);

      return res.status(201).json({
        id,
        url: `/p/${id}`,
        rawUrl: `/raw/${id}`,
        paste: newPaste,
      });
    } catch (err) {
      console.error("Error creating paste:", err);
      return res.status(500).json({ error: "Failed to create paste." });
    }
  },

  /**
   * GET /api/pastes/:id
   * Fetch snippet JSON details
   */
  async getPaste(req, res) {
    try {
      const { id } = req.params;
      const paste = await pasteStore.findById(id);

      if (!paste) {
        return res.status(404).json({ error: "Paste not found or has already expired/been burned." });
      }

      // Check expiration
      if (paste.expiresAt && new Date() > new Date(paste.expiresAt)) {
        await pasteStore.delete(id);
        return res.status(410).json({ error: "This paste has expired." });
      }

      const isBurnAfterRead = paste.burnAfterRead;

      if (isBurnAfterRead) {
        // Burn immediately upon this read
        await pasteStore.delete(id);
      } else {
        paste.views = (paste.views || 0) + 1;
        await pasteStore.update(id, { views: paste.views });
      }

      return res.json({
        id: paste.id,
        title: paste.title,
        content: paste.content,
        language: paste.language,
        createdAt: paste.createdAt,
        expiresAt: paste.expiresAt,
        views: paste.views,
        burned: isBurnAfterRead,
      });
    } catch (err) {
      console.error("Error fetching paste:", err);
      return res.status(500).json({ error: "Failed to fetch paste." });
    }
  },

  /**
   * GET /raw/:id
   * Fetch raw plaintext code snippet
   */
  async getRawPaste(req, res) {
    try {
      const { id } = req.params;
      const paste = await pasteStore.findById(id);

      if (!paste) {
        return res.status(404).type("text/plain").send("Error: Paste not found or already burned.");
      }

      if (paste.expiresAt && new Date() > new Date(paste.expiresAt)) {
        await pasteStore.delete(id);
        return res.status(410).type("text/plain").send("Error: Paste has expired.");
      }

      if (paste.burnAfterRead) {
        await pasteStore.delete(id);
      } else {
        paste.views = (paste.views || 0) + 1;
        await pasteStore.update(id, { views: paste.views });
      }

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(paste.content);
    } catch (err) {
      console.error("Error retrieving raw paste:", err);
      return res.status(500).type("text/plain").send("Server error retrieving paste.");
    }
  },
};
