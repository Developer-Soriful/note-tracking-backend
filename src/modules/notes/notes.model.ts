import { Schema, model } from "mongoose";
import { INote } from "./notes.types";

const noteSchema = new Schema<INote>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 20_000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Supports user's own notes listing and stable pagination.
// Also supports filtering notes by user and sorting by creation time.
noteSchema.index({
  user: 1,
  createdAt: -1,
  _id: -1,
});

// Supports admin listing all notes with stable pagination.
noteSchema.index({
  createdAt: -1,
  _id: -1,
});

export const Note = model<INote>("Note", noteSchema);
