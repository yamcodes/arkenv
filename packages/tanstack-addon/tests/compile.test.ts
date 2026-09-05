import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AddOnCompiledSchema } from "@tanstack/create";
import { describe, expect, it } from "vitest";
import { compileAddon } from "../scripts/build";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");
const repoRoot = resolve(packageRoot, "../..");

describe("TanStack Add-on Compilation", () => {
	it("compiles a schema-valid add-on bundle in memory without disk side-effects", () => {
		const compiled = compileAddon();

		// Validate against TanStack CLI's AddOnCompiledSchema
		const parsed = AddOnCompiledSchema.safeParse(compiled);
		expect(parsed.error).toBeUndefined();
		expect(parsed.success).toBe(true);

		// Assert key fields
		expect(compiled.id).toBe("arkenv");
		expect(compiled.name).toBe("ArkEnv");
		expect(compiled.category).toBe("tooling");
		expect(compiled.phase).toBe("add-on");
		expect(compiled.modes).toContain("file-router");

		// Assert files dictionary
		expect(compiled.files).toHaveProperty("src/env.ts.ejs");
		expect(compiled.files).toHaveProperty("src/routes/demo/arkenv.tsx.ejs");
		expect(compiled.files).toHaveProperty("_dot_env.example");

		// Assert integrations
		expect(compiled.integrations).toEqual([
			{
				type: "vite-plugin",
				import: "import arkenv from '@arkenv/vite-plugin'",
				code: "arkenv()",
			},
		]);

		// Assert routes
		expect(compiled.routes).toEqual([
			{
				url: "/demo/arkenv",
				name: "ArkEnv Demo",
				path: "src/routes/demo/arkenv.tsx",
				jsName: "ArkEnvDemo",
			},
		]);

		// Assert options
		expect(compiled.options?.validator).toBeDefined();
		expect(compiled.options?.validator.default).toBe("arktype");
		expect(compiled.options?.demo).toBeDefined();
		expect(compiled.options?.demo.default).toBe("true");
	});

	it("ensures committed public bundles match source templates without drift", () => {
		const freshCompiled = compileAddon();

		const publicInfo = resolve(repoRoot, "apps/www/public/tanstack/info.json");
		const publicAddon = resolve(
			repoRoot,
			"apps/www/public/tanstack/add-on.json",
		);
		const publicAssets = resolve(repoRoot, "apps/www/public/tanstack/assets");

		expect(existsSync(publicInfo)).toBe(true);
		expect(existsSync(publicAddon)).toBe(true);
		expect(existsSync(publicAssets)).toBe(true);

		const committedInfo = JSON.parse(readFileSync(publicInfo, "utf-8"));
		const committedAddon = JSON.parse(readFileSync(publicAddon, "utf-8"));

		expect(committedInfo).toEqual(freshCompiled);
		expect(committedAddon).toEqual(freshCompiled);
	});
});
