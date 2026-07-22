import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resetBootGateForTests, runBootGate } from "./boot-gate";
import {
	getBootGateResult,
	resetBootGateResultForTests,
} from "./boot-gate-state";

afterEach(() => {
	resetBootGateForTests();
	resetBootGateResultForTests();
});

describe("Nuxt boot gate", () => {
	it("coerces NUXT_PUBLIC_* string overrides into runtimeConfig.public", () => {
		const tempDir = path.resolve(__dirname, "temp-boot-gate-coerce");
		fs.mkdirSync(tempDir, { recursive: true });
		const schemaPath = path.join(tempDir, "env.ts");

		fs.writeFileSync(
			schemaPath,
			`
			import arkenv from "@arkenv/nuxt";
			export const env = arkenv({
				DATABASE_URL: "string",
				NUXT_PUBLIC_PORT: "number",
				NUXT_PUBLIC_ENABLED: "boolean",
				NODE_ENV: "'development' | 'production' | 'test' = 'test'",
			});
			`,
		);

		const runtimeConfig: {
			public: Record<string, unknown>;
			DATABASE_URL?: unknown;
			[key: string]: unknown;
		} = {
			public: {
				NUXT_PUBLIC_PORT: "4000",
				NUXT_PUBLIC_ENABLED: "false",
				NODE_ENV: "test",
			},
			DATABASE_URL: "postgres://localhost/db",
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

			expect(runtimeConfig.public.NUXT_PUBLIC_PORT).toBe(4000);
			expect(typeof runtimeConfig.public.NUXT_PUBLIC_PORT).toBe("number");
			expect(runtimeConfig.public.NUXT_PUBLIC_ENABLED).toBe(false);
			expect(runtimeConfig.DATABASE_URL).toBe("postgres://localhost/db");

			const gated = getBootGateResult();
			expect(gated?.NUXT_PUBLIC_PORT).toBe(4000);
			expect(gated?.NUXT_PUBLIC_ENABLED).toBe(false);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("fails fast on invalid NUXT_PUBLIC_* boot overrides", () => {
		const tempDir = path.resolve(__dirname, "temp-boot-gate-invalid");
		fs.mkdirSync(tempDir, { recursive: true });
		const schemaPath = path.join(tempDir, "env.ts");

		fs.writeFileSync(
			schemaPath,
			`
			import arkenv from "@arkenv/nuxt";
			export const env = arkenv({
				NUXT_PUBLIC_PORT: "number",
			});
			`,
		);

		const runtimeConfig = {
			public: {
				NUXT_PUBLIC_PORT: "not-a-number",
			},
		};

		try {
			expect(() =>
				runBootGate(
					{
						schemaPath,
						layout: "simple",
						baseDir: "",
						engine: "arktype",
					},
					runtimeConfig,
				),
			).toThrow();
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
