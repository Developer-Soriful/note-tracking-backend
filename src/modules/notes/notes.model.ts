import { Schema, model } from "mongoose";
import { INote } from "./notes.types";

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 20_000,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Supports user-specific note listing and pagination.
noteSchema.index({
  user: 1,
  createdAt: -1,
  _id: -1,
});

// Supports admin-wide note listing and pagination.
noteSchema.index({
  createdAt: -1,
  _id: -1,
});

export const Note = model<INote>("Note", noteSchema);
