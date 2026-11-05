// src/routes/apiRoutes.js
import { Router } from "express";
import { pasteController } from "../controllers/pasteController.js";

const router = Router();

router.post("/pastes", pasteController.createPaste);
router.get("/pastes/:id", pasteController.getPaste);

export default router;
