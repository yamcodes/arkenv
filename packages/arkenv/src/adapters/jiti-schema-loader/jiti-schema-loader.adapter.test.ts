import fsp from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JitiSchemaLoaderAdapter } from "./jiti-schema-loader.adapter";

const packagesDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../../..",
);

const requireFromCore = createRequire(
	path.join(packagesDir, "core/package.json"),
);
const requireFromStandard = createRequire(
	path.join(packagesDir, "standard/package.json"),
);

const jitiAliases = {
	"@arkenv/core": path.join(packagesDir, "core/src/index.ts"),
	"@arkenv/standard": path.join(packagesDir, "standard/src/index.ts"),
	arktype: requireFromCore.resolve("arktype"),
	zod: requireFromCore.resolve("zod"),
	valibot: requireFromStandard.resolve("valibot"),
};

describe("JitiSchemaLoaderAdapter", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "schema-loader-"));
	});

	afterEach(async () => {
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	it("loads ArkType keys without a populated environment", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/core";
			// comments and extra imports must not matter
			export const env = arkenv({
				DATABASE_URL: "string",
				PORT: "0 <= number.integer <= 65535 = 3000",
				CI: "boolean = false",
			});
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.keys.map((key) => key.name)).toEqual([
			"DATABASE_URL",
			"PORT",
			"CI",
		]);
		expect(result.keys[1]?.hasDefault).toBe(true);
		expect(result.schema.DATABASE_URL).toBe("string");
	});

	it("loads compiled ArkType schemas with per-key defaults", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv, { type } from "@arkenv/core";
			export const env = arkenv(
				type({
					DATABASE_URL: "string = 'foo'",
					PORT: "number",
				}),
			);
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.keys.map((key) => key.name)).toEqual([
			"PORT",
			"DATABASE_URL",
		]);
		expect(
			result.keys.find((key) => key.name === "DATABASE_URL")?.hasDefault,
		).toBe(true);
		expect(result.keys.find((key) => key.name === "PORT")?.hasDefault).toBe(
			false,
		);
		expect(result.schema.DATABASE_URL).toBe("string");
	});

	it("loads Valibot defaulted keys", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/standard";
			import * as v from "valibot";
			export const env = arkenv({
				HOST: v.optional(v.string(), "localhost"),
				PORT: v.optional(v.number(), 3000),
			});
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.keys.map((key) => key.name)).toEqual(["HOST", "PORT"]);
		expect(result.keys.every((key) => key.hasDefault)).toBe(true);
	});

	it("treats arkenv({}) as a valid empty schema", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/core";
			export const env = arkenv({});
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.keys).toEqual([]);
	});

	it("allows declarative comparisons against the capture stub", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/core";
			export const env = arkenv({ NODE_ENV: "string" });
			export const isProd = env.NODE_ENV === "production";
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.keys.map((key) => key.name)).toEqual(["NODE_ENV"]);
	});

	it("loads Zod Standard Schema keys without a populated environment", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/standard";
			import * as z from "zod";

			const shared = { DATABASE_URL: z.string() };
			export const env = arkenv({
				...shared,
				PORT: z.number().default(3000),
			});
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.keys.map((key) => key.name)).toEqual([
			"DATABASE_URL",
			"PORT",
		]);
		expect(result.keys[1]?.hasDefault).toBe(true);
	});

	it("loads schemas that re-export helpers from another file", async () => {
		await fsp.writeFile(
			path.join(tempDir, "shared.ts"),
			`export const SHARED = { HOST: "string" } as const;`,
		);
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/core";
			import { SHARED } from "./shared.ts";
			export const env = arkenv({
				...SHARED,
				PORT: "number",
			});
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.keys.map((key) => key.name)).toEqual(["HOST", "PORT"]);
	});

	it("returns ERR_INSPECT_EVAL_THROW when the module throws", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			throw new Error("schema exploded");
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.code).toBe("ERR_INSPECT_EVAL_THROW");
		expect(result.message).toContain("schema exploded");
	});

	it("returns ERR_INSPECT_NO_CALL when arkenv() is never called", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(schemaPath, "export const env = { PORT: 3000 };");

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.code).toBe("ERR_INSPECT_NO_CALL");
		expect(result.message).toContain("called at the top level");
		expect(result.message).not.toContain("Upgrade @arkenv/core");
	});

	it("returns ERR_INSPECT_UNSUPPORTED when validation runs despite capture", async () => {
		const fakeCorePath = path.join(tempDir, "fake-core.ts");
		await fsp.writeFile(
			fakeCorePath,
			`
			export default function arkenv() {
				const error = new Error("Errors found while validating environment variables");
				error.name = "ArkEnvError";
				throw error;
			}
			`,
		);
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/core";
			export const env = arkenv({ DATABASE_URL: "string" });
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({
			jitiAliases: {
				...jitiAliases,
				"@arkenv/core": fakeCorePath,
			},
		});
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.code).toBe("ERR_INSPECT_UNSUPPORTED");
		expect(result.message).toContain("Upgrade @arkenv/core");
	});

	it("returns ERR_INSPECT_UNEXTRACTABLE for a non-object captured definition", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/core";
			export const env = arkenv(null as never);
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.code).toBe("ERR_INSPECT_UNEXTRACTABLE");
		expect(result.message).toContain("Cannot extract keys");
	});

	it("returns ERR_INSPECT_EVAL_THROW when the module requires env values at load time", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(
			schemaPath,
			`
			import arkenv from "@arkenv/core";
			export const env = arkenv({ DATABASE_URL: "string" });
			if (!env.DATABASE_URL) throw new Error("missing DATABASE_URL");
			`,
		);

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.code).toBe("ERR_INSPECT_EVAL_THROW");
		expect(result.message).toContain("does not populate env values");
	});

	describe("validate", () => {
		it("validates an ArkType schema successfully against a matching environment", async () => {
			const schemaPath = path.join(tempDir, "env.ts");
			await fsp.writeFile(
				schemaPath,
				`
				import arkenv from "@arkenv/core";
				export const env = arkenv({
					DATABASE_URL: "string",
					PORT: "0 <= number.integer <= 65535 = 3000",
				});
				`,
			);

			const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
			const result = await loader.validate(
				{ schemaPath },
				{ DATABASE_URL: "postgres://localhost/db", PORT: "8080" },
			);

			expect(result.ok).toBe(true);
		});

		it("returns formatted issues when ArkType validation fails", async () => {
			const schemaPath = path.join(tempDir, "env.ts");
			await fsp.writeFile(
				schemaPath,
				`
				import arkenv from "@arkenv/core";
				export const env = arkenv({
					DATABASE_URL: "string",
					PORT: "number",
				});
				`,
			);

			const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
			const result = await loader.validate(
				{ schemaPath },
				{ DATABASE_URL: "postgres://localhost/db", PORT: "not-a-number" },
			);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.kind).toBe("validation");
			if (result.kind === "validation") {
				expect(result.issues.length).toBeGreaterThan(0);
				expect(result.message).toContain(
					"Errors found while validating environment variables",
				);
			}
		});

		it("validates a Zod Standard Schema successfully and fails on missing vars", async () => {
			const schemaPath = path.join(tempDir, "env.ts");
			await fsp.writeFile(
				schemaPath,
				`
				import arkenv from "@arkenv/standard";
				import * as z from "zod";
				export const env = arkenv({
					API_KEY: z.string(),
					PORT: z.coerce.number().default(3000),
				});
				`,
			);

			const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
			const successResult = await loader.validate(
				{ schemaPath },
				{ API_KEY: "secret-key" },
			);
			expect(successResult.ok).toBe(true);

			const failResult = await loader.validate({ schemaPath }, {});
			expect(failResult.ok).toBe(false);
			if (failResult.ok) return;
			expect(failResult.kind).toBe("validation");
			if (failResult.kind === "validation") {
				expect(
					failResult.issues.find((i) => i.path === "API_KEY"),
				).toBeDefined();
			}
		});

		it("restores process.env even if validation throws", async () => {
			process.env.__TEST_PERSISTENT_ENV__ = "original-value";
			const schemaPath = path.join(tempDir, "env.ts");
			await fsp.writeFile(
				schemaPath,
				`
				import arkenv from "@arkenv/core";
				export const env = arkenv({
					REQUIRED_VAR: "string",
				});
				`,
			);

			const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
			await loader.validate(
				{ schemaPath },
				{ __TEST_PERSISTENT_ENV__: "mutated-value" },
			);

			expect(process.env.__TEST_PERSISTENT_ENV__).toBe("original-value");
			delete process.env.__TEST_PERSISTENT_ENV__;
		});
	});
});
