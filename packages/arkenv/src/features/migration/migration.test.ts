import { describe, expect, it } from "vitest";
import {
	detectLegacyProject,
	isLegacyDtsCode,
	isLegacyEnvCode,
	isLegacyPackageJsonCode,
	isLegacyViteConfigCode,
	migrateDtsCode,
	migrateEnvCode,
	migratePackageJsonCode,
	migrateViteConfigCode,
} from "./migration";

describe("migration feature", () => {
	describe("detection", () => {
		it("detects legacy ArkType env schema", () => {
			const code = `
import { type } from "arktype";

export const Env = type({
	PORT: "number.port = 3000",
	VITE_API_URL: "string",
});
`;
			expect(isLegacyEnvCode(code)).toBe(true);
		});

		it("detects legacy v0 arkenv library import", () => {
			const code = `
import arkenv from "arkenv";
import { z } from "zod";

export const Env = z.object({
	PORT: z.number().default(3000),
});
`;
			expect(isLegacyEnvCode(code)).toBe(true);
		});

		it("does not flag modern canonical v1 env schema", () => {
			const code = `
import arkenv from "@arkenv/core";

export const env = arkenv({
	PORT: "number.port = 3000",
});

export default env;
`;
			expect(isLegacyEnvCode(code)).toBe(false);
		});

		it("detects legacy Vite config with Env import or arkenvVitePlugin(Env)", () => {
			const code = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import arkenvVitePlugin from "@arkenv/vite-plugin";
import { Env } from "./src/env";

export default defineConfig({
	plugins: [react(), arkenvVitePlugin(Env)],
});
`;
			expect(isLegacyViteConfigCode(code)).toBe(true);
		});

		it("does not flag modern v1 Vite config with zero-arg plugin", () => {
			const code = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import arkenvVitePlugin from "@arkenv/vite-plugin";

export default defineConfig({
	plugins: [react(), arkenvVitePlugin()],
});
`;
			expect(isLegacyViteConfigCode(code)).toBe(false);
		});

		it("detects legacy ambient .d.ts augmentations", () => {
			const code = `/// <reference types="vite/client" />

type ImportMetaEnvAugmented = import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
	typeof import("./src/env").Env
>;

interface ImportMetaEnv extends ImportMetaEnvAugmented {}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
`;
			expect(isLegacyDtsCode(code)).toBe(true);
		});

		it("detects legacy arkenv library dependency in package.json", () => {
			const pkg = JSON.stringify({
				dependencies: {
					arkenv: "^0.9.0",
					react: "^19.0.0",
				},
			});
			expect(isLegacyPackageJsonCode(pkg)).toBe(true);
		});

		it("combines detection across project files", () => {
			const result = detectLegacyProject({
				envCode: 'export const Env = type({ PORT: "number" });',
				viteConfigCode: "export default { plugins: [arkenvVitePlugin(Env)] };",
				dtsCode: "type ImportMetaEnvAugmented = any;",
				packageJsonCode: JSON.stringify({ dependencies: { arkenv: "1.0.0" } }),
			});
			expect(result.isLegacy).toBe(true);
			expect(result.hasLegacyEnvFile).toBe(true);
			expect(result.hasLegacyViteConfig).toBe(true);
			expect(result.hasLegacyDtsFile).toBe(true);
			expect(result.hasLegacyPackageJson).toBe(true);
			expect(result.reasons.length).toBe(4);
		});
	});

	describe("migrateEnvCode", () => {
		it("migrates ArkType schema with type({...})", () => {
			const v0Code = `import { type } from "arktype";

/**
 * Environment variable schema.
 */
export const Env = type({
	PORT: "number.port = 3000",
	VITE_API_URL: "string",
});
`;
			const result = migrateEnvCode(v0Code);
			expect(result.updated).toBe(true);
			expect(result.code).toContain(
				'import arkenv, { type } from "@arkenv/core";',
			);
			expect(result.code).toContain("export const env = arkenv({");
			expect(result.code).toContain("export default env;");
			expect(result.code).not.toContain("export const Env");
		});

		it("migrates Zod schema from v0 arkenv import", () => {
			const v0Code = `import arkenv from "arkenv";
import { z } from "zod";

export const Env = z.object({
	PORT: z.number().default(3000),
});
`;
			const result = migrateEnvCode(v0Code);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('from "@arkenv/standard"');
			expect(result.code).toContain("export const env = arkenv(");
			expect(result.code).toContain("export default env;");
		});

		it("migrates Valibot schema", () => {
			const v0Code = `import arkenv from "arkenv";
import * as v from "valibot";

export const Env = v.object({
	PORT: v.number(),
});
`;
			const result = migrateEnvCode(v0Code);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('from "@arkenv/standard"');
			expect(result.code).toContain("export const env = arkenv(");
		});

		it("removes redundant arkenv(Env) when converting export const Env", () => {
			const v0Code = `import arkenv, { type } from "arkenv";

export const Env = type({
	PORT: "number",
});

export const env = arkenv(Env);
`;
			const result = migrateEnvCode(v0Code);
			expect(result.updated).toBe(true);
			expect(result.code).toContain("export const env = arkenv({");
			expect(result.code).not.toContain("export const env = arkenv(Env);");
		});
	});

	describe("migrateViteConfigCode", () => {
		it("removes Env import and updates arkenvVitePlugin(Env) to arkenvVitePlugin()", () => {
			const v0Config = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import arkenvVitePlugin from "@arkenv/vite-plugin";
import { Env } from "./src/env";

export default defineConfig({
	plugins: [react(), arkenvVitePlugin(Env)],
});
`;
			const result = migrateViteConfigCode(v0Config);
			expect(result.updated).toBe(true);
			expect(result.code).not.toContain('import { Env } from "./src/env"');
			expect(result.code).toContain("arkenvVitePlugin()");
			expect(result.code).toContain("react()");
		});

		it("handles multi-import with Env and other symbols", () => {
			const v0Config = `import { defineConfig } from "vite";
import { Env, SOME_OTHER_CONST } from "./src/env";
import arkenvVitePlugin from "@arkenv/vite-plugin";

export default defineConfig({
	plugins: [arkenvVitePlugin(Env)],
});
`;
			const result = migrateViteConfigCode(v0Config);
			expect(result.updated).toBe(true);
			expect(result.code).toContain(
				'import { SOME_OTHER_CONST } from "./src/env";',
			);
			expect(result.code).not.toContain("Env,");
			expect(result.code).toContain("arkenvVitePlugin()");
		});

		it("preserves complex adjacent plugins snapshot", () => {
			const complexConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import arkenvVitePlugin from "@arkenv/vite-plugin";
import { Env } from "./src/env";

export default defineConfig({
	plugins: [
		react({ fastRefresh: true }),
		tailwindcss(),
		arkenvVitePlugin(Env),
		visualizer({ open: false }),
	],
	server: {
		port: 3000,
	},
});
`;
			const result = migrateViteConfigCode(complexConfig);
			expect(result.updated).toBe(true);
			expect(result.code).toMatchInlineSnapshot(`
				"import { defineConfig } from "vite";
				import react from "@vitejs/plugin-react";
				import tailwindcss from "@tailwindcss/vite";
				import { visualizer } from "rollup-plugin-visualizer";
				import arkenvVitePlugin from "@arkenv/vite-plugin";

				export default defineConfig({
					plugins: [
						react({ fastRefresh: true }),
						tailwindcss(),
						arkenvVitePlugin(),
						visualizer({ open: false }),
					],
					server: {
						port: 3000,
					},
				});
				"
			`);
		});
	});

	describe("migrateDtsCode", () => {
		it("cleans up ambient declaration file while retaining vite/client reference", () => {
			const v0Dts = `/// <reference types="vite/client" />

type ImportMetaEnvAugmented = import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
	typeof import("./src/env").Env
>;

interface ImportMetaEnv extends ImportMetaEnvAugmented {}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
`;
			const result = migrateDtsCode(v0Dts);
			expect(result.updated).toBe(true);
			expect(result.shouldDelete).toBe(false);
			expect(result.code).toBe('/// <reference types="vite/client" />\n');
		});

		it("marks standalone Bun dts without extra types as shouldDelete", () => {
			const v0BunDts = `type ProcessEnvAugmented = import("@arkenv/bun-plugin").ProcessEnvAugmented<
	typeof import("./src/env").Env
>;

declare namespace NodeJS {
	interface ProcessEnv extends ProcessEnvAugmented {}
}
`;
			const result = migrateDtsCode(v0BunDts);
			expect(result.updated).toBe(true);
			expect(result.shouldDelete).toBe(true);
		});

		it("preserves custom user declarations in dts file", () => {
			const v0DtsWithCustom = `/// <reference types="vite/client" />

type ImportMetaEnvAugmented = import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
	typeof import("./src/env").Env
>;

interface ImportMetaEnv extends ImportMetaEnvAugmented {}

declare module "*.svg" {
	const content: string;
	export default content;
}
`;
			const result = migrateDtsCode(v0DtsWithCustom);
			expect(result.updated).toBe(true);
			expect(result.shouldDelete).toBe(false);
			expect(result.code).toContain('declare module "*.svg"');
			expect(result.code).toContain('/// <reference types="vite/client" />');
			expect(result.code).not.toContain("ImportMetaEnvAugmented");
		});
	});

	describe("migratePackageJsonCode", () => {
		it("swaps 'arkenv' dependency for '@arkenv/core'", () => {
			const pkg = {
				name: "my-app",
				dependencies: {
					arkenv: "^0.9.0",
					react: "^19.0.0",
				},
				devDependencies: {
					"@arkenv/vite-plugin": "^0.9.0",
				},
			};
			const result = migratePackageJsonCode(
				JSON.stringify(pkg, null, 2),
				"@arkenv/core",
			);
			expect(result.updated).toBe(true);
			const parsed = JSON.parse(result.code);
			expect(parsed.dependencies.arkenv).toBeUndefined();
			expect(parsed.dependencies["@arkenv/core"]).toBeDefined();
			expect(parsed.dependencies.react).toBe("^19.0.0");
		});

		it("swaps 'arkenv' dependency for '@arkenv/standard' when validator is zod", () => {
			const pkg = {
				name: "my-app",
				dependencies: {
					arkenv: "^0.9.0",
					zod: "^3.23.8",
				},
			};
			const result = migratePackageJsonCode(
				JSON.stringify(pkg, null, 2),
				"@arkenv/standard",
			);
			expect(result.updated).toBe(true);
			const parsed = JSON.parse(result.code);
			expect(parsed.dependencies.arkenv).toBeUndefined();
			expect(parsed.dependencies["@arkenv/standard"]).toBeDefined();
		});
	});
});
