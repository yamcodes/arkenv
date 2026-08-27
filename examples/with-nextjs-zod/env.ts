import { z } from "zod";
import arkenv from "@/.arkenv";

export const env = arkenv({
	DATABASE_URL: z.string().default("postgres://localhost:5432/mydb"),
	NEXT_PUBLIC_API_URL: z.string().default("https://api.example.com"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
});
