import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
	PORT: z.coerce.number().default(3000),
	VITE_MY_VAR: z.string().default("hello"),
	VITE_MY_NUMBER: z.coerce.number().default(42),
	VITE_MY_BOOLEAN: z.coerce.boolean().default(true),
});

export default env;
