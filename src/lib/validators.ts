import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content is too long"),
  album: z.string().nullable().optional(),
});

export const updateDescriptionSchema = z.object({
  description: z.string().max(500, "Description is too long"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdateDescriptionInput = z.infer<typeof updateDescriptionSchema>;
