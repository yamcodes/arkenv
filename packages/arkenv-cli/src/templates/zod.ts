export const zodTemplate = (
	frameworkNote: string,
) => `import arkenv from "arkenv/standard";
import { z } from "zod";

const Env = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]),
	PORT: z.coerce.number().positive(),
});

/**
 * ArkEnv handles environment variable validation and type-safety.
 * \${frameworkNote}
 */
export const env = arkenv(Env);
`;
