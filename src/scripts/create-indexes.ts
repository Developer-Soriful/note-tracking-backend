import "dotenv/config";

import { connectDatabase, disconnectDatabase } from "../database/connection";
import { Note } from "../modules/notes/notes.model";
import { Post } from "../modules/posts/posts.model";
import { User } from "../modules/users/users.model";
import { safeErrorMessage } from "../shared/utils/safe-error-message";

const createIndexes = async (): Promise<void> => {
  await connectDatabase();
  await Promise.all([
    User.createIndexes(),
    Note.createIndexes(),
    Post.createIndexes(),
  ]);
  console.info("Database indexes created successfully");
};

const main = async (): Promise<void> => {
  try {
    await createIndexes();
  } catch (error: unknown) {
    console.error("Database index creation failed:", safeErrorMessage(error));
    process.exitCode = 1;
  } finally {
    try {
      await disconnectDatabase();
    } catch (error: unknown) {
      console.error("Database disconnect failed:", safeErrorMessage(error));
      process.exitCode = 1;
    }
  }
};

void main();
