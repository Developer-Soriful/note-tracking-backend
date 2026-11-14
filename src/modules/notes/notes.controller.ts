import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error";

import {
  CreateNoteInput,
  notesService,
  UpdateNoteInput,
} from "./notes.service";

import { noteIdSchema, notePaginationSchema } from "./notes.validation";

const getRequester = (
  req: Parameters<RequestHandler>[0],
): { id: string; role: "user" | "admin" } => {
  if (!req.user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  return req.user;
};

const getNotes: RequestHandler = async (req, res) => {
  const requester = getRequester(req);

  const paginationResult = notePaginationSchema.safeParse(req.query);

  if (!paginationResult.success) {
    throw new AppError(
      "Invalid pagination parameters",
      400,
      "VALIDATION_ERROR",
      paginationResult.error.issues,
    );
  }

  const isAdmin = requester.role === "admin";
  const showOnlyMine = paginationResult.data.mine === true;

  const result =
    isAdmin && !showOnlyMine
      ? await notesService.getAllNotes(paginationResult.data)
      : await notesService.getMyNotes(requester.id, paginationResult.data);

  res.status(200).json({
    success: true,
    message: "Notes retrieved successfully",
    data: result,
  });
};

const createNote: RequestHandler = async (req, res) => {
  const requester = getRequester(req);

  const note = await notesService.createNote(
    req.body as CreateNoteInput,
    requester.id,
  );

  res.status(201).json({
    success: true,
    message: "Note created successfully",
    data: note,
  });
};

const getNoteById: RequestHandler = async (req, res) => {
  const requester = getRequester(req);

  const idResult = noteIdSchema.safeParse(req.params.noteId);

  if (!idResult.success) {
    throw new AppError("Invalid note ID", 400, "INVALID_NOTE_ID");
  }

  const note = await notesService.getNoteById(idResult.data, requester);

  res.status(200).json({
    success: true,
    message: "Note retrieved successfully",
    data: note,
  });
};

const updateNote: RequestHandler = async (req, res) => {
  const requester = getRequester(req);

  const idResult = noteIdSchema.safeParse(req.params.noteId);

  if (!idResult.success) {
    throw new AppError("Invalid note ID", 400, "INVALID_NOTE_ID");
  }

  const note = await notesService.updateNote(
    idResult.data,
    req.body as UpdateNoteInput,
    requester.id,
  );

  res.status(200).json({
    success: true,
    message: "Note updated successfully",
    data: note,
  });
};

const deleteNote: RequestHandler = async (req, res) => {
  const requester = getRequester(req);

  const idResult = noteIdSchema.safeParse(req.params.noteId);

  if (!idResult.success) {
    throw new AppError("Invalid note ID", 400, "INVALID_NOTE_ID");
  }

  await notesService.deleteNote(idResult.data, requester.id);

  res.status(200).json({
    success: true,
    message: "Note deleted successfully",
  });
};

export const notesController = {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
};
