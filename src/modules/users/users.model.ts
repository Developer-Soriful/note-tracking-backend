import { Schema, model } from "mongoose";
import { IUser } from "./users.types";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },

    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Enforces unique email addresses.
userSchema.index({ email: 1 }, { unique: true });

// Supports stable, paginated admin user listing.
userSchema.index({
  createdAt: -1,
  _id: -1,
});

// Supports aggregation filtering and queries on user interests.
userSchema.index({ interests: 1 });

export const User = model<IUser>("User", userSchema);
