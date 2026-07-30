import { afterEach, describe, expect, it } from "vitest";
import { resetBootGateForTests } from "./boot-gate";
import {
	resetBootGateResultForTests,
	setBootGateResult,
} from "./boot-gate-state";
import { arkenv } from "./index";

afterEach(() => {
	resetBootGateForTests();
	resetBootGateResultForTests();
	delete (globalThis as { window?: unknown }).window;
});

describe("arkenv (Nuxt runtime)", () => {
	it("should parse a basic environment variable", () => {
		process.env.DATABASE_URL = "postgres://localhost:5432/db";
		setBootGateResult({
			DATABASE_URL: "postgres://localhost:5432/db",
		});

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
		setBootGateResult({
			DATABASE_URL: "postgres://localhost:5432/db",
			NUXT_PUBLIC_API_URL: "https://api.example.com",
			NODE_ENV: "test",
		});

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
	});

	it("should throw an error when accessing a server-side variable on the client", () => {
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

			const keys = Object.keys(env);
			expect(keys).toContain("NUXT_PUBLIC_API_URL");
			expect(keys).toContain("NODE_ENV");
			expect(keys).not.toContain("DATABASE_URL");

			const ownKeys = Reflect.ownKeys(env);
			expect(ownKeys).toContain("NUXT_PUBLIC_API_URL");
			expect(ownKeys).not.toContain("DATABASE_URL");

			expect("NUXT_PUBLIC_API_URL" in env).toBe(true);
			expect("DATABASE_URL" in env).toBe(false);

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

	it("should keep coerced server types from the boot-gate result", () => {
		setBootGateResult({
			PORT: 9090,
			DEBUG: true,
		});

		const env = arkenv({
			PORT: "number",
			DEBUG: "boolean",
		});

		expect(env.PORT).toBe(9090);
		expect(typeof env.PORT).toBe("number");
		expect(env.DEBUG).toBe(true);
		expect(typeof env.DEBUG).toBe("boolean");
	});

	it("should keep coerced client types when values are sourced from __NUXT__.config.public", () => {
		const originalWindow = globalThis.window;
		(globalThis as any).window = {
			__NUXT__: {
				config: {
					public: {
						NUXT_PUBLIC_PORT: 4000,
						NUXT_PUBLIC_ENABLED: false,
					},
				},
			},
		};

		try {
			const env = arkenv({
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
