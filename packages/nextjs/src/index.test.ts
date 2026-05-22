import { describe, expect, it } from "vitest";
import { createEnv } from "./index";

describe("createEnv", () => {
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

	it("should enforce NEXT_PUBLIC_ prefix for client keys at compile-time and runtime", () => {
		expect(() => {
			createEnv({
				client: {
					// @ts-expect-error - Client keys must be prefixed with NEXT_PUBLIC_
					API_URL: "string",
				},
				runtimeEnv: {
					API_URL: "https://api.example.com",
				},
			});
		}).toThrow(
			"Client-side environment variables must be prefixed with 'NEXT_PUBLIC_'",
		);

		expect(() => {
			createEnv({
				client: {
					// @ts-expect-error - testing invalid key prefix
					INVALID_KEY: "string",
				},
				runtimeEnv: {
					INVALID_KEY: "value",
				},
			});
		}).toThrow(
			"Client-side environment variables must be prefixed with 'NEXT_PUBLIC_'",
		);
	});

	it("should enforce that runtimeEnv contains all client and shared keys at compile-time and runtime", () => {
		expect(() => {
			createEnv({
				client: {
					NEXT_PUBLIC_API_URL: "string",
				},
				shared: {
					NODE_ENV: "string",
				},
				// @ts-expect-error - runtimeEnv is missing required NEXT_PUBLIC_API_URL and NODE_ENV
				runtimeEnv: {
					// Missing keys!
				},
			});
		}).toThrow("Missing key in runtimeEnv: NEXT_PUBLIC_API_URL");

		expect(() => {
			createEnv({
				client: {
					NEXT_PUBLIC_API_URL: "string",
				},
				runtimeEnv: {
					// testing missing client key in runtimeEnv
				} as any,
			});
		}).toThrow("Missing key in runtimeEnv: NEXT_PUBLIC_API_URL");

		expect(() => {
			createEnv({
				shared: {
					NODE_ENV: "string",
				},
				runtimeEnv: {
					// testing missing shared key in runtimeEnv
				} as any,
			});
		}).toThrow("Missing key in runtimeEnv: NODE_ENV");
	});

	it("should throw in browser context when accessing a server-only key, but allow client/shared keys", () => {
		// Mock window object
		const originalWindow = globalThis.window;
		try {
			// @ts-expect-error - simulating browser environment
			globalThis.window = {};

			const env = createEnv({
				server: {
					DATABASE_URL: "string",
				},
				client: {
					NEXT_PUBLIC_API_URL: "string",
				},
				shared: {
					NODE_ENV: "string",
				},
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "test",
				},
			});

			// Accessing client/shared variables should work fine
			expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");

			// Accessing server variable on the client must throw
			expect(() => {
				env.DATABASE_URL;
			}).toThrow(
				"Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.",
			);
		} finally {
			// Restore globalThis.window
			globalThis.window = originalWindow;
		}
	});

	it("should automatically fall back to process.env for server-only keys omitted from runtimeEnv on the server", () => {
		const originalEnv = process.env.DATABASE_URL;
		process.env.DATABASE_URL = "postgres://localhost:5432/fallback_db";

		try {
			const env = createEnv({
				server: {
					DATABASE_URL: "string",
				},
				// runtimeEnv does not contain DATABASE_URL!
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

	it("should support default values in schema when omitted or undefined in runtimeEnv", () => {
		const env = createEnv({
			server: {
				DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
			},
			client: {
				NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: undefined,
			} as any,
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/mydb");
		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
	});
});
