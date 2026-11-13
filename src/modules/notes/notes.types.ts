
import type { Types } from "mongoose";

export interface INote {
  title: string;
  content: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicNote {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
