// TODO: import this from arkenv
import { type } from "arktype";

export const envSchema = type({
	VITE_API_URL: "string",
	VITE_DEBUG: "boolean",
});
