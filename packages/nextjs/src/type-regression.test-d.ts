import { describe, expectTypeOf, it } from "vitest";
import { createEnv } from "./index";

describe("@arkenv/nextjs type regression", () => {
	it("infers client variables as their validated type", () => {
		const env = createEnv({
			server: {
				DATABASE_URL: "string",
			},
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		expectTypeOf(env.NEXT_PUBLIC_API_URL).toBeString();
	});

	it("infers docs-style imports as string values", () => {
		const env = createEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		const apiUrl = env.NEXT_PUBLIC_API_URL;

		expectTypeOf(apiUrl).toBeString();
	});
});
