// Zod schema for validating poll creation input

import { z } from "zod";

export const createPollSchema = z.object({
  title: z.string().trim().min(3, "Question must be at least 3 characters"),
  options: z
    .array(z.string().trim().min(1, "Option can't be empty"))
    .min(2, "Add at least 2 options"),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;