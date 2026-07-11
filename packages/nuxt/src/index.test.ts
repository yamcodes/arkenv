import { describe, expect, it } from "vitest";
import { arkenv } from "./index";

describe("arkenv (Nuxt runtime)", () => {
	it("should parse a basic environment variable", () => {
		process.env.DATABASE_URL = "postgres://localhost:5432/db";

		const env = arkenv({
			server: {
				DATABASE_URL: "string",
			},
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
		delete process.env.DATABASE_URL;
	});

	it("should enforce NUXT_PUBLIC_ prefix for client keys at compile-time and runtime", () => {
		expect(() => {
			arkenv({
				client: {
					API_URL: "string",
				},
			});
		}).toThrow(
			"Client-side environment variables must be prefixed with 'NUXT_PUBLIC_'",
		);
	});

	it("should allow accessing server-side, client, and shared variables on the server", () => {
		process.env.DATABASE_URL = "postgres://localhost:5432/db";
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
		process.env.NODE_ENV = "test";

		const env = arkenv({
			server: {
				DATABASE_URL: "string",
			},
			client: {
				NUXT_PUBLIC_API_URL: "string",
			},
			shared: {
				NODE_ENV: "string",
			},
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
		expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");

		delete process.env.DATABASE_URL;
		delete process.env.NUXT_PUBLIC_API_URL;
		delete process.env.NODE_ENV;
	});

	it("should throw an error when accessing a server-side variable on the client", () => {
		// Mock window to simulate browser client
		const originalWindow = globalThis.window;
		(globalThis as any).window = {
			__NUXT__: {
				config: {
					public: {
						NUXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
					},
				},
			},
		};

		try {
			const env = arkenv({
				server: {
					DATABASE_URL: "string",
				},
				client: {
					NUXT_PUBLIC_API_URL: "string",
				},
				shared: {
					NODE_ENV: "string",
				},
			});

			expect(env.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");

			expect(() => {
				env.DATABASE_URL;
			}).toThrow(
				"Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.",
			);

			// Enumerate keys
			const keys = Object.keys(env);
			expect(keys).toContain("NUXT_PUBLIC_API_URL");
			expect(keys).toContain("NODE_ENV");
			expect(keys).not.toContain("DATABASE_URL");

			// ownKeys
			const ownKeys = Reflect.ownKeys(env);
			expect(ownKeys).toContain("NUXT_PUBLIC_API_URL");
			expect(ownKeys).toContain("NODE_ENV");
			expect(ownKeys).not.toContain("DATABASE_URL");

			// in operator
			expect("NUXT_PUBLIC_API_URL" in env).toBe(true);
			expect("DATABASE_URL" in env).toBe(false);

			// getOwnPropertyDescriptor
			expect(
				Object.getOwnPropertyDescriptor(env, "NUXT_PUBLIC_API_URL"),
			).toBeDefined();
			expect(
				Object.getOwnPropertyDescriptor(env, "DATABASE_URL"),
			).toBeUndefined();
		} finally {
			(globalThis as any).window = originalWindow;
		}
	});

	it("should allow Vue reactivity internal properties on the proxy without throwing", () => {
		const originalWindow = globalThis.window;
		(globalThis as any).window = {
			__NUXT__: {
				config: {
					public: {
						NUXT_PUBLIC_API_URL: "https://api.example.com",
					},
				},
			},
		};

		try {
			const env = arkenv({
				client: {
					NUXT_PUBLIC_API_URL: "string",
				},
			});

			const envRecord = env as Record<string, unknown>;
			expect(envRecord.__v_isRef).toBeUndefined();
			expect(envRecord.__v_isReactive).toBeUndefined();
			expect(envRecord.__v_isReadonly).toBeUndefined();
			expect(envRecord.__v_raw).toBeUndefined();
		} finally {
			(globalThis as any).window = originalWindow;
		}
	});
});
