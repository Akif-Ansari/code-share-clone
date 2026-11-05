// src/routes/viewRoutes.js
import { Router } from "express";
import path from "path";
import { nanoid } from "nanoid";
import { pasteController } from "../controllers/pasteController.js";

const router = Router();
const viewDir = path.resolve(process.cwd(), "view");

// Visiting root creates a fresh live collaborative session and redirects to /p/:id
router.get("/", (req, res) => {
  const newId = nanoid(8);
  res.redirect(`/p/${newId}`);
});

// Create explicit new session
router.get("/new", (req, res) => {
  const newId = nanoid(8);
  res.redirect(`/p/${newId}`);
});

// Live collaborative editor room: /p/:id
router.get("/p/:id", (req, res) => {
  res.sendFile(path.join(viewDir, "editor.html"));
});

// Raw plain text endpoint: /raw/:id
router.get("/raw/:id", pasteController.getRawPaste);

export default router;
