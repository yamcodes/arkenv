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

	it("validates ArkType schema strings across schema sections", () => {
		createEnv({
			server: {
				DATABASE_URL: "string.url",
				PORT: "number.port = 3000",
			},
			client: {
				NEXT_PUBLIC_API_URL: "string.url",
			},
			shared: {
				NODE_ENV: "'development' | 'production' | 'test' = 'development'",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			},
		});
	});

	it("rejects invalid ArkType schema strings across schema sections", () => {
		createEnv({
			server: {
				// @ts-expect-error invalid ArkType schema string
				DATABASE_URL: "not-a-valid-type",
				// @ts-expect-error invalid ArkType schema string
				PORT: "not-a-valid-type",
			},
			client: {
				// @ts-expect-error invalid ArkType schema string
				NEXT_PUBLIC_API_URL: "not-a-valid-type",
			},
			shared: {
				// @ts-expect-error invalid ArkType schema string
				NODE_ENV: "not-a-valid-type",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "development",
			},
		});
	});

	it("enforces NEXT_PUBLIC_ client keys", () => {
		createEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string.url",
				// @ts-expect-error client variables must be prefixed with NEXT_PUBLIC_
				API_URL: "string.url",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
				API_URL: "https://api.example.com",
			},
		});
	});
});
