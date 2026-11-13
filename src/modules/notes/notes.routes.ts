import { Router } from "express";

import { notesController } from "./notes.controller";

import { createNoteSchema, updateNoteSchema } from "./notes.validation";

import { authenticate } from "../../shared/middleware/auth.middleware";

import { validateBody } from "../../shared/middleware/validate.middleware";

const router = Router();

// Every notes endpoint requires authentication.
router.use(authenticate);

// GET /api/v1/notes
router.get("/", notesController.getNotes);

// POST /api/v1/notes
router.post("/", validateBody(createNoteSchema), notesController.createNote);

// GET /api/v1/notes/:noteId
router.get("/:noteId", notesController.getNoteById);

// PATCH /api/v1/notes/:noteId
router.patch(
  "/:noteId",
  validateBody(updateNoteSchema),
  notesController.updateNote,
);

// DELETE /api/v1/notes/:noteId
router.delete("/:noteId", notesController.deleteNote);

export default router;
