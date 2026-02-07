import { z } from 'zod';

export const ExampleParamsSchema = z.object({
  id: z.string().uuid({ message: 'Example id must be a valid UUID.' }),
});

export const ExampleResponseSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  avatarUrl: z.string().url(),
  bio: z.string().nullable(),
  updatedAt: z.string(),
});

export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;

export const ExampleTableRowSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  updated_at: z.string(),
});

export type ExampleRow = z.infer<typeof ExampleTableRowSchema>;
