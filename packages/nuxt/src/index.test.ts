import { describe, expect, it } from "vitest";
import { createEnv } from "./index";

describe("createEnv (Nuxt runtime)", () => {
	it("should parse a basic environment variable", () => {
		process.env.DATABASE_URL = "postgres://localhost:5432/db";

		const env = createEnv({
			server: {
				DATABASE_URL: "string",
			},
		});

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
		delete process.env.DATABASE_URL;
	});

	it("should enforce NUXT_PUBLIC_ prefix for client keys at compile-time and runtime", () => {
		expect(() => {
			// @ts-expect-error - Client keys must be prefixed with NUXT_PUBLIC_
			createEnv({
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
			const env = createEnv({
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

	it("should support flat layout at runtime on both client and server", () => {
		process.env.DATABASE_URL = "postgres://localhost:5432/db";
		process.env.NUXT_PUBLIC_API_URL = "https://api.example.com";
		process.env.NODE_ENV = "test";
		process.env.CUSTOM_SHARED = "shared-value";

		// Server-side flat schema evaluation
		const serverEnv = createEnv(
			{
				DATABASE_URL: "string",
				NUXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
				CUSTOM_SHARED: "string",
			},
			{
				exposeToClient: ["CUSTOM_SHARED"],
			},
		);

		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
		expect(serverEnv.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(serverEnv.NODE_ENV).toBe("test");
		expect(serverEnv.CUSTOM_SHARED).toBe("shared-value");

		// Client-side flat schema evaluation
		const originalWindow = globalThis.window;
		(globalThis as any).window = {
			__NUXT__: {
				config: {
					public: {
						NUXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
						CUSTOM_SHARED: "shared-value",
					},
				},
			},
		};

		try {
			const clientEnv = createEnv(
				{
					DATABASE_URL: "string",
					NUXT_PUBLIC_API_URL: "string",
					NODE_ENV: "string",
					CUSTOM_SHARED: "string",
				},
				{
					exposeToClient: ["CUSTOM_SHARED"],
				},
			);

			expect(clientEnv.NUXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(clientEnv.NODE_ENV).toBe("test");
			expect(clientEnv.CUSTOM_SHARED).toBe("shared-value");

			expect(() => {
				clientEnv.DATABASE_URL;
			}).toThrow(
				"Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.",
			);
		} finally {
			(globalThis as any).window = originalWindow;
			delete process.env.DATABASE_URL;
			delete process.env.NUXT_PUBLIC_API_URL;
			delete process.env.NODE_ENV;
			delete process.env.CUSTOM_SHARED;
		}
	});

	it("should support, validate and merge runtimeEnv correctly in flat layout", () => {
		// Verify runtimeEnv merges and overrides process.env
		process.env.DATABASE_URL = "original-db";
		try {
			const env = createEnv(
				{
					DATABASE_URL: "string",
					NUXT_PUBLIC_API_URL: "string",
				},
				{
					runtimeEnv: {
						DATABASE_URL: "override-db",
						NUXT_PUBLIC_API_URL: "https://override.api.com",
					},
				},
			);

			expect(env.DATABASE_URL).toBe("override-db");
			expect(env.NUXT_PUBLIC_API_URL).toBe("https://override.api.com");

			// Verify it throws if runtimeEnv has a key not defined in schema
			expect(() => {
				createEnv(
					{
						DATABASE_URL: "string",
					},
					{
						runtimeEnv: {
							DATABASE_URL: "db-val",
							UNDEFINED_KEY: "invalid",
						},
					},
				);
			}).toThrow(
				"Environment variable 'UNDEFINED_KEY' is passed to runtimeEnv but is not defined in the schema.",
			);
		} finally {
			delete process.env.DATABASE_URL;
		}
	});

	it("should dynamically resolve client keys from useRuntimeConfig on the client", () => {
		const originalWindow = globalThis.window;
		(globalThis as any).window = {};

		(globalThis as any).__mockRuntimeConfig = {
			public: {
				NUXT_PUBLIC_API_URL: "https://dynamic-config.api.com",
				NUXT_PUBLIC_PORT: "3000",
				NUXT_PUBLIC_FEATURE_FLAG: "true",
			},
		};

		try {
			const env = createEnv({
				NUXT_PUBLIC_API_URL: "string",
				NUXT_PUBLIC_PORT: "number",
				NUXT_PUBLIC_FEATURE_FLAG: "boolean",
			});

			expect(env.NUXT_PUBLIC_API_URL).toBe("https://dynamic-config.api.com");
			// Coercion must survive the security proxy (raw runtimeConfig strings are not preferred)
			expect(env.NUXT_PUBLIC_PORT).toBe(3000);
			expect(typeof env.NUXT_PUBLIC_PORT).toBe("number");
			expect(env.NUXT_PUBLIC_FEATURE_FLAG).toBe(true);
			expect(typeof env.NUXT_PUBLIC_FEATURE_FLAG).toBe("boolean");
		} finally {
			(globalThis as any).window = originalWindow;
			delete (globalThis as any).__mockRuntimeConfig;
		}
	});

	it("should dynamically resolve server keys from useRuntimeConfig on the server", () => {
		(globalThis as any).__mockRuntimeConfig = {
			DATABASE_URL: "postgres://dynamic-server/db",
			PORT: "8080",
			public: {},
		};

		try {
			const env = createEnv({
				DATABASE_URL: "string",
				PORT: "number",
			});

			expect(env.DATABASE_URL).toBe("postgres://dynamic-server/db");
			expect(env.PORT).toBe(8080);
			expect(typeof env.PORT).toBe("number");
		} finally {
			delete (globalThis as any).__mockRuntimeConfig;
		}
	});

	it("should return coerced values from the process.env fallback path on the server", () => {
		// No runtimeConfig mock — forces the former process.env preference path
		delete (globalThis as any).__mockRuntimeConfig;
		process.env.PORT = "9090";
		process.env.DEBUG = "true";

		try {
			const env = createEnv({
				PORT: "number",
				DEBUG: "boolean",
			});

			expect(env.PORT).toBe(9090);
			expect(typeof env.PORT).toBe("number");
			expect(env.DEBUG).toBe(true);
			expect(typeof env.DEBUG).toBe("boolean");
		} finally {
			delete process.env.PORT;
			delete process.env.DEBUG;
		}
	});

	it("should return coerced client values from __NUXT__.config.public without preferring raw strings", () => {
		const originalWindow = globalThis.window;
		(globalThis as any).window = {
			__NUXT__: {
				config: {
					public: {
						NUXT_PUBLIC_PORT: "4000",
						NUXT_PUBLIC_ENABLED: "false",
					},
				},
			},
		};

		try {
			const env = createEnv({
				NUXT_PUBLIC_PORT: "number",
				NUXT_PUBLIC_ENABLED: "boolean",
			});

			expect(env.NUXT_PUBLIC_PORT).toBe(4000);
			expect(typeof env.NUXT_PUBLIC_PORT).toBe("number");
			expect(env.NUXT_PUBLIC_ENABLED).toBe(false);
			expect(typeof env.NUXT_PUBLIC_ENABLED).toBe("boolean");
		} finally {
			(globalThis as any).window = originalWindow;
		}
	});
});
