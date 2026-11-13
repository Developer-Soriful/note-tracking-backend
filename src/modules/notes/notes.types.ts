import type { Types } from "mongoose";

export interface INote {
  user: Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

export interface NotePaginationInput {
  page: number;
  limit: number;
}

export interface PublicNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}