import { validator } from "hono/validator";
import { CreateCommentInput } from "../types/models";

const LIMITS = {
     author: 100,
     title: 200,
     body: 5000,
} as const;

export const createCommentValidator = validator("json", (value, c) => {
     const input: Partial<Record<keyof CreateCommentInput, unknown>> = value ?? {};
     const errors: string[] = [];
     const result = {} as CreateCommentInput;

     for (const field of Object.keys(LIMITS) as (keyof CreateCommentInput)[]) {
          const raw = input[field];

          if (typeof raw !== "string" || !raw.trim()) {
               errors.push(`${field} is required`);
               continue;
          }

          const trimmed = raw.trim();
          if (trimmed.length > LIMITS[field]) {
               errors.push(`${field} must be at most ${LIMITS[field]} characters`);
               continue;
          }

          result[field] = trimmed;
     }

     if (errors.length)
          return c.json({ errors }, 400);

     return result;
});
