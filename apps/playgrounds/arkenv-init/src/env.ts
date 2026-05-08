import { arkenv } from "arkenv/zod";
import { z } from "zod";

const schema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	PORT: z.coerce.number().positive(),
});

/**
 * ArkEnv handles environment variable validation and typesafety.
 * For Vite, ensure you add the @arkenv/vite-plugin to your vite.config.ts.
 */
export const env = arkenv(schema);
