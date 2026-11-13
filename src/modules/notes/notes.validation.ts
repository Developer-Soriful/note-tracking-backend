import { z } from "zod";

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20_000),
});

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(20_000).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required",
  );

export const notePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const noteIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid note ID");
