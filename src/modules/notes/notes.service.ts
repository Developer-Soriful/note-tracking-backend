import { AppError } from "../../shared/errors/app-error";
import { UserRole } from "../users/users.types";
import { Note } from "./notes.model";
import { PublicNote } from "./notes.types";

interface CreateNoteInput {
  title: string;
  content: string;
}

interface UpdateNoteInput {
  title?: string;
  content?: string;
}

interface PaginationInput {
  page: number;
  limit: number;
}

interface Requester {
  id: string;
  role: UserRole;
}

const toPublicNote = (note: {
  _id: unknown;
  title: string;
  content: string;
  user: unknown;
  createdAt: Date;
  updatedAt: Date;
}): PublicNote => ({
  id: String(note._id),
  title: note.title,
  content: note.content,
  userId: String(note.user),
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

const createNote = async (
  input: CreateNoteInput,
  userId: string,
): Promise<PublicNote> => {
  const note = await Note.create({
    title: input.title,
    content: input.content,
    user: userId,
  });

  return toPublicNote(note);
};

const getMyNotes = async (userId: string, pagination: PaginationInput) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [notes, totalNotes] = await Promise.all([
    Note.find({ user: userId })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),

    Note.countDocuments({ user: userId }),
  ]);

  return {
    notes: notes.map(toPublicNote),
    pagination: {
      page,
      limit,
      totalNotes,
      totalPages: Math.ceil(totalNotes / limit),
    },
  };
};

const getAllNotes = async (pagination: PaginationInput) => {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [notes, totalNotes] = await Promise.all([
    Note.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),

    Note.countDocuments(),
  ]);

  return {
    notes: notes.map(toPublicNote),
    pagination: {
      page,
      limit,
      totalNotes,
      totalPages: Math.ceil(totalNotes / limit),
    },
  };
};

const getNoteById = async (
  noteId: string,
  requester: Requester,
): Promise<PublicNote> => {
  const filter =
    requester.role === "admin"
      ? { _id: noteId }
      : { _id: noteId, user: requester.id };

  const note = await Note.findOne(filter);

  if (!note) {
    throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
  }

  return toPublicNote(note);
};

const updateNote = async (
  noteId: string,
  input: UpdateNoteInput,
  userId: string,
): Promise<PublicNote> => {
  const note = await Note.findOneAndUpdate(
    {
      _id: noteId,
      user: userId,
    },
    {
      $set: input,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!note) {
    throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
  }

  return toPublicNote(note);
};

const deleteNote = async (noteId: string, userId: string): Promise<void> => {
  const note = await Note.findOneAndDelete({
    _id: noteId,
    user: userId,
  });

  if (!note) {
    throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
  }
};

export const notesService = {
  createNote,
  getMyNotes,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
