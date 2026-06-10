import { describe, expect, it } from "vitest";
import { createEnv } from "./index";

describe("createEnv (Nuxt runtime)", () => {
	it("should parse a basic environment variable", () => {
		const env = createEnv({
			server: {
				DATABASE_URL: "string",
			},
			runtimeEnv: {
				DATABASE_URL: "postgres://localhost:5432/db",
			},
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should enforce NUXT_PUBLIC_ prefix for client keys at compile-time and runtime", () => {
		expect(() => {
			createEnv({
				client: {
					// @ts-expect-error - Client keys must be prefixed with NUXT_PUBLIC_
					API_URL: "string",
				},
				runtimeEnv: {
					API_URL: "https://api.example.com",
				},
			});
		}).toThrow(
			"Client-side environment variables must be prefixed with 'NUXT_PUBLIC_'",
		);
	});

	it("should enforce that runtimeEnv contains all client and shared keys", () => {
		expect(() => {
			createEnv({
				client: {
					NUXT_PUBLIC_API_URL: "string",
				},
				shared: {
					NODE_ENV: "string",
				},
				// @ts-expect-error - runtimeEnv is missing required NUXT_PUBLIC_API_URL and NODE_ENV
				runtimeEnv: {
					// Missing keys!
				},
			});
		}).toThrow("Missing key in runtimeEnv: NUXT_PUBLIC_API_URL");
	});

	it("should allow accessing server-side, client, and shared variables on the server", () => {
		const env = createEnv({
			server: {
				DATABASE_URL: "string",
			},
			client: {
				NUXT_PUBLIC_API_URL: "string",
			},
			shared: {
				NODE_ENV: "string",
			},
			runtimeEnv: {
				NUXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "test",
				DATABASE_URL: "postgres://localhost:5432/db",
			},
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("should automatically fall back to process.env for server-only keys omitted from runtimeEnv on the server", () => {
		const originalEnv = process.env.DATABASE_URL;
		process.env.DATABASE_URL = "postgres://localhost:5432/fallback_db";

		try {
			const env = createEnv({
				server: {
					DATABASE_URL: "string",
				},
				runtimeEnv: {},
			});

			expect(env.DATABASE_URL).toBe("postgres://localhost:5432/fallback_db");
		} finally {
			if (originalEnv === undefined) {
				delete process.env.DATABASE_URL;
			} else {
				process.env.DATABASE_URL = originalEnv;
			}
		}
	});

	it("should throw an error when accessing a server-side variable on the client", () => {
		// Mock window to simulate browser client
		const originalWindow = globalThis.window;
		(globalThis as any).window = {};

		try {
			const env = createEnv({
				server: {
					DATABASE_URL: "string",
				},
				client: {
					NUXT_PUBLIC_API_URL: "string",
				},
				shared: {
					NODE_ENV: "string",
				},
				runtimeEnv: {
					NUXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "test",
				},
			});

			expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");

			expect(() => {
				env.DATABASE_URL;
			}).toThrow(
				"Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.",
			);
		} finally {
			(globalThis as any).window = originalWindow;
		}
	});
});
