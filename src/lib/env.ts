import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api"),
  NEXT_PUBLIC_ERROR_REPORT_URL: z.string().url().optional(),
});

// Reference each NEXT_PUBLIC_* var literally so Next can inline it at build time.
const parsed = schema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_ERROR_REPORT_URL: process.env.NEXT_PUBLIC_ERROR_REPORT_URL,
});

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "❌ Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
