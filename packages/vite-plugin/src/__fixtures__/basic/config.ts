import { type } from "arkenv";

export const envSchema = type({
	VITE_API_URL: "string",
	VITE_DEBUG: "boolean",
});
