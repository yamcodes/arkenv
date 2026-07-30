import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resetBootGateForTests, runBootGate } from "./boot-gate";
import {
	resetBootGateResultForTests,
	setBootGateResult,
} from "./boot-gate-state";
import { arkenv } from "./index";

afterEach(() => {
	resetBootGateForTests();
	resetBootGateResultForTests();
	delete (globalThis as { window?: unknown }).window;
	delete process.env.PORT;
	delete process.env.DEBUG;
	delete process.env.NUXT_PUBLIC_PORT;
	delete process.env.NUXT_PUBLIC_ENABLED;
	delete process.env.DATABASE_URL;
});

/**
 * Regressions for the two Nuxt coercion honesty bugs:
 *
 * 1. Security proxy preferred raw `process.env` / `__NUXT__` strings over the
 *    coerced validation target (#1327).
 * 2. Nitro boot `NUXT_PUBLIC_*` overrides stayed as strings in `runtimeConfig`
 *    (#1424).
 *
 * Under thin accessors, (1) is "prefer boot-gate result over raw process.env";
 * (2) is "runBootGate coerces string overrides, then thin `arkenv()` reads them".
 */
describe("Nuxt coercion honesty regressions", () => {
	it("prefers the boot-gate coerced result over raw process.env strings", () => {
		// Gate already produced numbers; process.env still has the raw strings
		// Nitro / the shell would leave behind. Thin reads must not undo coercion.
		process.env.PORT = "9090";
		process.env.DEBUG = "true";
		setBootGateResult({
			PORT: 7777,
			DEBUG: false,
		});

		const env = arkenv({
			PORT: "number",
			DEBUG: "boolean",
		});

		expect(env.PORT).toBe(7777);
		expect(typeof env.PORT).toBe("number");
		expect(env.DEBUG).toBe(false);
		expect(typeof env.DEBUG).toBe("boolean");
	});

	it("coerces Nitro string overrides at the boot gate, then thin arkenv() returns numbers/booleans", () => {
		const tempDir = path.resolve(__dirname, "temp-coercion-regression-gate");
		fs.mkdirSync(tempDir, { recursive: true });
		const schemaPath = path.join(tempDir, "env.ts");

		fs.writeFileSync(
			schemaPath,
			`
			import arkenv from "@arkenv/nuxt";
			export const env = arkenv({
				DATABASE_URL: "string",
				PORT: "number",
				DEBUG: "boolean",
				NUXT_PUBLIC_PORT: "number",
				NUXT_PUBLIC_ENABLED: "boolean",
				NODE_ENV: "'development' | 'production' | 'test' = 'test'",
			});
			`,
		);

		// Raw string sources — the pre-fix shape for both bugs.
		process.env.DATABASE_URL = "postgres://localhost/db";
		process.env.PORT = "9090";
		process.env.DEBUG = "true";
		process.env.NUXT_PUBLIC_PORT = "4000";
		process.env.NUXT_PUBLIC_ENABLED = "false";

		const runtimeConfig: {
			public: Record<string, unknown>;
			DATABASE_URL?: unknown;
			PORT?: unknown;
			DEBUG?: unknown;
			[key: string]: unknown;
		} = {
			public: {
				NUXT_PUBLIC_PORT: "4000",
				NUXT_PUBLIC_ENABLED: "false",
				NODE_ENV: "test",
			},
			DATABASE_URL: "postgres://localhost/db",
			PORT: "9090",
			DEBUG: "true",
		};

		try {
			runBootGate(
				{
					schemaPath,
					layout: "simple",
					baseDir: "",
					engine: "arktype",
				},
				runtimeConfig,
			);

			// Bug 2: payload itself is coerced after the string overrides.
			expect(runtimeConfig.PORT).toBe(9090);
			expect(runtimeConfig.DEBUG).toBe(true);
			expect(runtimeConfig.public.NUXT_PUBLIC_PORT).toBe(4000);
			expect(runtimeConfig.public.NUXT_PUBLIC_ENABLED).toBe(false);

			// Bug 1 (thin era): even with process.env still holding strings,
			// arkenv() reads the coerced boot-gate result.
			const env = arkenv({
				DATABASE_URL: "string",
				PORT: "number",
				DEBUG: "boolean",
				NUXT_PUBLIC_PORT: "number",
				NUXT_PUBLIC_ENABLED: "boolean",
				NODE_ENV: "'development' | 'production' | 'test' = 'test'",
			});

			expect(env.PORT).toBe(9090);
			expect(typeof env.PORT).toBe("number");
			expect(env.DEBUG).toBe(true);
			expect(typeof env.DEBUG).toBe("boolean");
			expect(env.NUXT_PUBLIC_PORT).toBe(4000);
			expect(typeof env.NUXT_PUBLIC_PORT).toBe("number");
			expect(env.NUXT_PUBLIC_ENABLED).toBe(false);
			expect(typeof env.NUXT_PUBLIC_ENABLED).toBe("boolean");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("exposes coerced public values on the client via __NUXT__ (post-boot payload)", () => {
		const originalWindow = globalThis.window;
		// What the client receives after a successful boot gate + Nitro serialize.
		(globalThis as { window?: unknown }).window = {
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
			(globalThis as { window?: unknown }).window = originalWindow;
		}
	});

	it("does not re-coerce raw strings on the client (coercion is boot-gate only)", () => {
		const originalWindow = globalThis.window;
		// If the boot gate never wrote coerced values, thin client reads stay strings.
		(globalThis as { window?: unknown }).window = {
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
			const env = arkenv({
				NUXT_PUBLIC_PORT: "number",
				NUXT_PUBLIC_ENABLED: "boolean",
			});

			expect(env.NUXT_PUBLIC_PORT).toBe("4000");
			expect(typeof env.NUXT_PUBLIC_PORT).toBe("string");
			expect(env.NUXT_PUBLIC_ENABLED).toBe("false");
			expect(typeof env.NUXT_PUBLIC_ENABLED).toBe("string");
		} finally {
			(globalThis as { window?: unknown }).window = originalWindow;
		}
	});
});
