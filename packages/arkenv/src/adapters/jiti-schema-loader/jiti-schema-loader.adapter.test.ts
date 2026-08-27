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
				PORT: v.fallback(v.pipe(v.string(), v.transform(Number)), 3000),
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
			import { z } from "zod";

			const shared = { DATABASE_URL: z.string() };
			export const env = arkenv({
				...shared,
				PORT: z.coerce.number().default(3000),
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

	it("returns a structured error when the module throws", async () => {
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
		expect(result.code).toBe("MODULE_LOAD_FAILED");
		expect(result.message).toContain("schema exploded");
	});

	it("returns a structured error when arkenv() is never called", async () => {
		const schemaPath = path.join(tempDir, "env.ts");
		await fsp.writeFile(schemaPath, "export const env = { PORT: 3000 };");

		const loader = new JitiSchemaLoaderAdapter({ jitiAliases });
		const result = await loader.load({ schemaPath });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.code).toBe("NO_SCHEMA");
		expect(result.message).toContain("upgrade @arkenv/core");
	});

	it("hints when the module requires env values at load time", async () => {
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
		expect(result.code).toBe("MODULE_LOAD_FAILED");
		expect(result.message).toContain("does not populate env values");
	});
});
