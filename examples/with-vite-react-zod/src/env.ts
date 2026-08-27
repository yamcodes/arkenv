import arkenv from "@arkenv/standard";
import { z } from "zod";

export const env = arkenv({
	PORT: z.number().default(3000),
	VITE_MY_VAR: z.string().default("hello"),
	VITE_MY_NUMBER: z.number().default(42),
	VITE_MY_BOOLEAN: z.boolean().default(true),
});

export default env;
