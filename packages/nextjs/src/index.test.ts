import { describe, expect, it } from "vitest";
import { arkenv as clientArkenv } from "./index";
import { arkenv as serverArkenv } from "./react-server";

describe("arkenv (RSC / Server Entrypoint)", () => {
	it("should parse a basic environment variable", () => {
		const env = serverArkenv({
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
			// @ts-expect-error - Client keys must be prefixed with NEXT_PUBLIC_
			serverArkenv({
				client: {
					API_URL: "string",
				},
				runtimeEnv: {
					API_URL: "https://api.example.com",
				},
			});
		}).toThrow(
			"Client-side environment variables must be prefixed with 'NEXT_PUBLIC_'",
		);
	});

	it("should enforce that runtimeEnv contains all client and shared keys at compile-time and runtime", () => {
		expect(() => {
			serverArkenv({
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
	});

	it("should allow accessing server-only, client, and shared variables on the server", () => {
		const env = serverArkenv({
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
				DATABASE_URL: "postgres://localhost:5432/db",
			},
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("should automatically fall back to process.env for server-only keys omitted from runtimeEnv on the server", () => {
		const originalEnv = process.env.DATABASE_URL;
		process.env.DATABASE_URL = "postgres://localhost:5432/fallback_db";

		try {
			const env = serverArkenv({
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
});

describe("arkenv (Client / SSR Entrypoint)", () => {
	it("should only validate client and shared schemas, skipping server schema validation", () => {
		// Even if DATABASE_URL is required in server schema,
		// and missing from runtimeEnv, clientArkenv should not throw validation errors
		// because server validation is skipped in client mode.
		const env = clientArkenv({
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

		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("should throw an error when accessing a server-side variable (simulating SSR / pre-rendering)", () => {
		const env = clientArkenv({
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

		// Accessing server key must throw an error, even if running on Node (simulating Server-Side Rendering of Client Components)
		expect(() => {
			env.DATABASE_URL;
		}).toThrow(
			"ArkEnv Error: Attempted to access server environment variable 'DATABASE_URL' on the client.",
		);
	});

	it("should support default values in schema when omitted or undefined in runtimeEnv", () => {
		const env = clientArkenv({
			server: {
				DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
			},
			client: {
				NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: undefined,
			},
		});

		// Client variables defaults still resolve
		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
	});

	describe("Flat Mode", () => {
		it("should validate and allow access to client and exposed variables, but throw for server-only variables on client", () => {
			const env = clientArkenv(
				{
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
					NODE_ENV: "string",
					CUSTOM_VAR: "string",
				},
				{
					exposeToClient: ["CUSTOM_VAR"],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
						CUSTOM_VAR: "custom_val",
					},
				},
			);

			expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");
			expect((env as any).CUSTOM_VAR).toBe("custom_val");

			expect(() => {
				(env as any).DATABASE_URL;
			}).toThrow(
				"ArkEnv Error: Attempted to access server environment variable 'DATABASE_URL' on the client.",
			);
		});

		it("should allow accessing all variables on the server in Flat Mode", () => {
			const env = serverArkenv(
				{
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
					NODE_ENV: "string",
					CUSTOM_VAR: "string",
				},
				{
					exposeToClient: ["CUSTOM_VAR"],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
						DATABASE_URL: "postgres://localhost:5432/db",
						CUSTOM_VAR: "custom_val",
					},
				},
			);

			expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
			expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");
			expect((env as any).CUSTOM_VAR).toBe("custom_val");
		});

		it("should support deprecated expose and shared options as fallbacks in Flat Mode", () => {
			const env = clientArkenv(
				{
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
					NODE_ENV: "string",
					CUSTOM_VAR: "string",
				},
				{
					expose: ["CUSTOM_VAR"],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
						CUSTOM_VAR: "custom_val",
					},
				},
			);

			expect((env as any).CUSTOM_VAR).toBe("custom_val");
		});
	});
});
