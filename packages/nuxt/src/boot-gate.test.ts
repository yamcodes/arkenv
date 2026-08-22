import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyBootGate, resetBootGateForTests, runBootGate } from "./boot-gate";
import {
	getBootGateResult,
	resetBootGateResultForTests,
} from "./boot-gate-state";

afterEach(() => {
	resetBootGateForTests();
	resetBootGateResultForTests();
});

describe("Nuxt boot gate - applyBootGate (pure transformation)", () => {
	it("coerces values and populates public and server runtimeConfig keys", () => {
		const schema = {
			PORT: "number",
			NUXT_PUBLIC_HOST: "string",
			NUXT_PUBLIC_ENABLED: "boolean",
		};
		const publicKeys = new Set(["NUXT_PUBLIC_HOST", "NUXT_PUBLIC_ENABLED"]);

		const runtimeConfig = {
			public: {
				NUXT_PUBLIC_HOST: "localhost",
				NUXT_PUBLIC_ENABLED: "true",
			},
			PORT: "3000",
		};

		const result = applyBootGate(
			schema as any,
			publicKeys,
			"arktype",
			runtimeConfig,
		);

		expect(runtimeConfig.PORT).toBe(3000);
		expect(typeof runtimeConfig.PORT).toBe("number");
		expect(runtimeConfig.public.NUXT_PUBLIC_HOST).toBe("localhost");
		expect(runtimeConfig.public.NUXT_PUBLIC_ENABLED).toBe(true);
		expect(typeof runtimeConfig.public.NUXT_PUBLIC_ENABLED).toBe("boolean");

		expect(result.PORT).toBe(3000);
		expect(result.NUXT_PUBLIC_ENABLED).toBe(true);
		expect(getBootGateResult()?.PORT).toBe(3000);
	});

	it("returns flattened runtimeConfig when schema is empty", () => {
		const runtimeConfig = {
			public: { FOO: "bar" },
			SECRET: "123",
		};

		const result = applyBootGate({}, new Set(), "arktype", runtimeConfig);
		expect(result).toEqual({ FOO: "bar", SECRET: "123" });
		expect(getBootGateResult()).toEqual({ FOO: "bar", SECRET: "123" });
	});

	it("fails fast when validation fails on invalid string value", () => {
		const schema = {
			PORT: "number",
		};

		const runtimeConfig = {
			PORT: "not-a-number",
		};

		expect(() =>
			applyBootGate(schema as any, new Set(), "arktype", runtimeConfig),
		).toThrow();
	});

	it("coerces values using standard engine", () => {
		const numberSchema = {
			"~standard": {
				version: 1,
				vendor: "mock",
				validate: (value: unknown) => {
					const n = Number(value);
					if (value === undefined || value === "" || Number.isNaN(n)) {
						return { issues: [{ message: "expected number" }] };
					}
					return { value: n };
				},
			},
		};

		const schema = {
			NUXT_PUBLIC_PORT: numberSchema,
		};
		const publicKeys = new Set(["NUXT_PUBLIC_PORT"]);

		const runtimeConfig = {
			public: {
				NUXT_PUBLIC_PORT: "9000",
			},
		};

		const result = applyBootGate(
			schema as any,
			publicKeys,
			"standard",
			runtimeConfig,
		);

		expect(runtimeConfig.public.NUXT_PUBLIC_PORT).toBe(9000);
		expect(typeof runtimeConfig.public.NUXT_PUBLIC_PORT).toBe("number");
		expect(result.NUXT_PUBLIC_PORT).toBe(9000);
	});
});

describe("Nuxt boot gate - runBootGate (capture + apply integration)", () => {
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

	it("keeps deliberate empty-string runtimeConfig overrides over process.env", () => {
		const tempDir = path.resolve(__dirname, "temp-boot-gate-empty");
		fs.mkdirSync(tempDir, { recursive: true });
		const schemaPath = path.join(tempDir, "env.ts");

		fs.writeFileSync(
			schemaPath,
			`
			import arkenv from "@arkenv/nuxt";
			export const env = arkenv({
				NUXT_PUBLIC_LABEL: "string",
			});
			`,
		);

		process.env.NUXT_PUBLIC_LABEL = "from-process-env";
		const runtimeConfig = {
			public: {
				NUXT_PUBLIC_LABEL: "",
			},
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

			expect(runtimeConfig.public.NUXT_PUBLIC_LABEL).toBe("");
			expect(getBootGateResult()?.NUXT_PUBLIC_LABEL).toBe("");
		} finally {
			delete process.env.NUXT_PUBLIC_LABEL;
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("coerces overrides with the standard engine", () => {
		const tempDir = path.resolve(__dirname, "temp-boot-gate-standard");
		fs.mkdirSync(tempDir, { recursive: true });
		const schemaPath = path.join(tempDir, "env.ts");

		fs.writeFileSync(
			schemaPath,
			`
			import arkenv from "@arkenv/nuxt/standard";

			const numberSchema = {
				"~standard": {
					version: 1,
					vendor: "mock",
					validate: (value: unknown) => {
						const n = Number(value);
						if (value === undefined || value === "" || Number.isNaN(n)) {
							return { issues: [{ message: "expected number" }] };
						}
						return { value: n };
					},
				},
			};

			export const env = arkenv({
				NUXT_PUBLIC_PORT: numberSchema,
			});
			`,
		);

		const runtimeConfig = {
			public: {
				NUXT_PUBLIC_PORT: "8080",
			},
		};

		try {
			runBootGate(
				{
					schemaPath,
					layout: "simple",
					baseDir: "",
					engine: "standard",
				},
				runtimeConfig,
			);

			expect(runtimeConfig.public.NUXT_PUBLIC_PORT).toBe(8080);
			expect(typeof runtimeConfig.public.NUXT_PUBLIC_PORT).toBe("number");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
