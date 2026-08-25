import dedent from "dedent";
import { describe, expect, it } from "vitest";
import {
	applyPresetToSchema,
	mutateEnvConfig,
	removePresetFromSchema,
	transformNextjsConfig,
	transformViteConfig,
	validateAndFindPresetBlocks,
} from "./config-mutation";

describe("config-mutation", () => {
	describe("transformViteConfig", () => {
		it("injects plugin into a standard vite.config.ts", async () => {
			const initialContent = dedent`
				import { defineConfig } from "vite"
				export default defineConfig({
					plugins: []
				})
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);

			expect(result.code).toContain(
				'import arkenvVitePlugin from "@arkenv/vite-plugin"',
			);
			expect(result.code).toContain("arkenvVitePlugin()");
		});

		it("injects zero-arg plugin even when envImportPath is provided", async () => {
			const initialContent = dedent`
				import { defineConfig } from "vite"
				export default defineConfig({
					plugins: []
				})
			`;

			const result = transformViteConfig({
				code: initialContent,
				envImportPath: "./env",
			});
			expect(result.success).toBe(true);

			expect(result.code).toContain(
				'import arkenvVitePlugin from "@arkenv/vite-plugin"',
			);
			expect(result.code).not.toContain("import { Env }");
			expect(result.code).toContain("arkenvVitePlugin()");
		});

		it("injects plugin into a simple object export", async () => {
			const initialContent = dedent`
				export default {
					plugins: []
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("arkenvVitePlugin()");
		});

		it("handles missing plugins array", async () => {
			const initialContent = dedent`
				export default {
					build: {}
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("plugins: [");
			expect(result.code).toContain("arkenvVitePlugin()");
		});

		it("does not duplicate plugin if already exists and returns updated: false", async () => {
			const initialContent = dedent`
				import arkenvVitePlugin from "@arkenv/vite-plugin"
				export default {
					plugins: [arkenvVitePlugin()]
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("returns updated: true when plugin is injected", async () => {
			const initialContent = dedent`
				export default {
					plugins: []
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
		});

		it("preserves original indentation", async () => {
			const initialContent = dedent`
				export default {
				    plugins: []
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("    plugins: [");
		});

		it("preserves tab indentation", async () => {
			const initialContent = "export default {\n\tplugins: []\n}";

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("\tplugins: [");
		});

		it("returns failure for invalid/too complex config", async () => {
			const initialContent = "export default someFunction()";

			const result = transformViteConfig({ code: initialContent });
			expect(result).toMatchObject({
				success: false,
				error: expect.stringContaining("Could not find default export object"),
			});
		});
	});

	describe("transformNextjsConfig", () => {
		it("wraps a plain object export with withArkEnv", async () => {
			const initialContent = dedent`
				export default {
					experimental: {}
				}
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('from "@arkenv/nextjs/config"');
			expect(result.code).toContain("withArkEnv({");
		});

		it("wraps a named variable export with withArkEnv", async () => {
			const initialContent = dedent`
				const nextConfig = {
					experimental: {}
				}
				export default nextConfig
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('from "@arkenv/nextjs/config"');
			expect(result.code).toContain("withArkEnv(nextConfig)");
		});

		it("returns updated: false if already wrapped with withArkEnv", async () => {
			const initialContent = dedent`
				import { withArkEnv } from "@arkenv/nextjs/config"
				export default withArkEnv({
					experimental: {}
				})
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("returns updated: false if withArkEnv is referenced elsewhere", async () => {
			const initialContent = dedent`
				import { withArkEnv } from "@arkenv/nextjs/config"
				const nextConfig = withArkEnv({ experimental: {} });
				export default nextConfig
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("returns failure for CommonJS module.exports", async () => {
			const initialContent = dedent`
				const nextConfig = {
					experimental: {}
				}
				module.exports = nextConfig
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result).toMatchObject({
				success: false,
				error: expect.stringContaining("CommonJS"),
			});
		});

		it("returns failure when no default export exists", async () => {
			const result = transformNextjsConfig({ code: "const x = 1;" });
			expect(result).toMatchObject({
				success: false,
				error: expect.stringContaining("Could not find default export"),
			});
		});

		it("preserves import when wrapping", async () => {
			const initialContent = dedent`
				import type { NextConfig } from "next"
				const nextConfig: NextConfig = {
					experimental: {}
				}
				export default nextConfig
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain('from "next"');
			expect(result.code).toContain("withArkEnv(nextConfig)");
		});

		it("preserves trailing newline when present", async () => {
			const initialContent = "export default { experimental: {} }\n";

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("withArkEnv({");
			expect(result.code).toMatch(/\n$/);
		});

		it("does not add trailing newline when absent", async () => {
			const initialContent = "export default { experimental: {} }";

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).not.toMatch(/\n$/);
		});

		it("wraps a plain object export with codegen: false option when disableCodegen is true", async () => {
			const initialContent = dedent`
				export default {
					experimental: {}
				}
			`;

			const result = transformNextjsConfig({
				code: initialContent,
				disableCodegen: true,
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('from "@arkenv/nextjs/config"');
			expect(result.code).toContain("withArkEnv({");
			expect(result.code).toContain("codegen: false");
		});
	});

	describe("validateAndFindPresetBlocks", () => {
		it("parses single unsuffixed preset block correctly", () => {
			const code = dedent`
				export const env = arkenv({
					PORT: "number.port = 3000",
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					VERCEL_ENV: "'production' | 'preview' | 'development'?",
					// @arkenv-preset-end vercel
				});
			`;
			const result = validateAndFindPresetBlocks(code);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.blocks).toHaveLength(1);
				expect(result.blocks[0].role).toBeUndefined();
				expect(result.blocks[0]).toMatchObject({
					markerId: "vercel",
					baseId: "vercel",
					keys: ["VERCEL", "VERCEL_ENV"],
				});
			}
		});

		it("parses role-suffixed preset blocks correctly", () => {
			const code = dedent`
				export const env = arkenv({
					// @arkenv-preset-start vercel:client
					NEXT_PUBLIC_VERCEL_ENV: "string?",
					// @arkenv-preset-end vercel:client
				});
			`;
			const result = validateAndFindPresetBlocks(code);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.blocks).toHaveLength(1);
				expect(result.blocks[0]).toMatchObject({
					markerId: "vercel:client",
					baseId: "vercel",
					role: "client",
					keys: ["NEXT_PUBLIC_VERCEL_ENV"],
				});
			}
		});

		it("parses multiple stacked preset blocks", () => {
			const code = dedent`
				export const env = arkenv({
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					// @arkenv-preset-end vercel
					// @arkenv-preset-start netlify
					NETLIFY: "string?",
					// @arkenv-preset-end netlify
				});
			`;
			const result = validateAndFindPresetBlocks(code);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.blocks).toHaveLength(2);
				expect(result.blocks[0].baseId).toBe("vercel");
				expect(result.blocks[1].baseId).toBe("netlify");
			}
		});

		it("fails closed on unclosed start marker", () => {
			const code = dedent`
				export const env = arkenv({
					// @arkenv-preset-start vercel
					VERCEL: "string?",
				});
			`;
			const result = validateAndFindPresetBlocks(code);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("unclosed");
			}
		});

		it("fails closed on unexpected end marker", () => {
			const code = dedent`
				export const env = arkenv({
					VERCEL: "string?",
					// @arkenv-preset-end vercel
				});
			`;
			const result = validateAndFindPresetBlocks(code);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("unexpected");
			}
		});

		it("fails closed on mismatched marker IDs", () => {
			const code = dedent`
				export const env = arkenv({
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					// @arkenv-preset-end netlify
				});
			`;
			const result = validateAndFindPresetBlocks(code);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("mismatched");
			}
		});

		it("fails closed on nested start markers", () => {
			const code = dedent`
				export const env = arkenv({
					// @arkenv-preset-start vercel
					// @arkenv-preset-start netlify
					VERCEL: "string?",
					// @arkenv-preset-end netlify
					// @arkenv-preset-end vercel
				});
			`;
			const result = validateAndFindPresetBlocks(code);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("nested or unclosed");
			}
		});
	});

	describe("applyPresetToSchema / mutateEnvConfig", () => {
		it("mutates flat env.ts with ArkType and wraps in markers", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					DATABASE_URL: "string",
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain("// @arkenv-preset-start vercel");
			expect(result.code).toContain('VERCEL: "string?"');
			expect(result.code).toContain(
				"VERCEL_ENV: \"'production' | 'preview' | 'development'?\"",
			);
			expect(result.code).toContain(
				"NEXT_PUBLIC_VERCEL_ENV: \"'production' | 'preview' | 'development'?\"",
			);
			expect(result.code).toContain("// @arkenv-preset-end vercel");
		});

		it("mutates flat env.ts with Zod correctly", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";
				import { z } from "zod";

				export const env = arkenv({
					DATABASE_URL: z.string(),
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "zod",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain("// @arkenv-preset-start vercel");
			expect(result.code).toContain("VERCEL: z.string().optional()");
			expect(result.code).toContain(
				'VERCEL_ENV: z.enum(["production", "preview", "development"]).optional()',
			);
			expect(result.code).toContain("// @arkenv-preset-end vercel");
		});

		it("mutates flat env.ts with Valibot correctly", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";
				import * as v from "valibot";

				export const env = arkenv({
					DATABASE_URL: v.string(),
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "valibot",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain("// @arkenv-preset-start vercel");
			expect(result.code).toContain("VERCEL: v.optional(v.string())");
			expect(result.code).toContain(
				'VERCEL_ENV: v.optional(v.picklist(["production", "preview", "development"]))',
			);
			expect(result.code).toContain("// @arkenv-preset-end vercel");
		});

		it("refreshes (nuke-and-pave) existing preset block", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					DATABASE_URL: "string",
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					// @arkenv-preset-end vercel
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('VERCEL: "string?"');
			expect(result.code).toContain(
				"VERCEL_ENV: \"'production' | 'preview' | 'development'?\"",
			);
		});

		it("returns updated: false if managed block is already up-to-date", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					DATABASE_URL: "string",
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					VERCEL_ENV: "'production' | 'preview' | 'development'?",
					VERCEL_URL: "string?",
					NEXT_PUBLIC_VERCEL_ENV: "'production' | 'preview' | 'development'?",
					NEXT_PUBLIC_VERCEL_URL: "string?",
					// @arkenv-preset-end vercel
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("fails closed when key collides with unmarked / user-owned key", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					DATABASE_URL: "string",
					VERCEL: "string?",
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});
			expect(result.success).toBe(false);
			expect(result.updated).toBe(false);
			expect(result.error).toContain("Collision detected");
			expect(result.error).toContain("VERCEL");
		});

		it("fails closed when key collides with another managed preset block", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					DATABASE_URL: "string",
					// @arkenv-preset-start other
					VERCEL: "string?",
					// @arkenv-preset-end other
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});
			expect(result.success).toBe(false);
			expect(result.updated).toBe(false);
			expect(result.error).toContain("Collision detected");
			expect(result.error).toContain("other");
		});

		it("fails closed when markers in file are malformed", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					// @arkenv-preset-start vercel
					VERCEL: "string?",
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain("Malformed preset markers");
		});

		it("supports custom markerId for strict role blocks", () => {
			const initialContent = dedent`
				import arkenv from "@arkenv/nextjs/client";

				export const env = arkenv({
					NEXT_PUBLIC_API_URL: "string",
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
				markerId: "vercel:client",
				targetKeys: ["NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_VERCEL_URL"],
			});

			expect(result.success).toBe(true);
			expect(result.code).toContain("// @arkenv-preset-start vercel:client");
			expect(result.code).toContain(
				"NEXT_PUBLIC_VERCEL_ENV: \"'production' | 'preview' | 'development'?\"",
			);
			expect(result.code).toContain("// @arkenv-preset-end vercel:client");
		});
	});

	describe("removePresetFromSchema", () => {
		it("removes single unsuffixed preset block", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					DATABASE_URL: "string",
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					VERCEL_ENV: "'production' | 'preview' | 'development'?",
					// @arkenv-preset-end vercel
				});
			`;

			const result = removePresetFromSchema(initialContent, {
				preset: "vercel",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).not.toContain("VERCEL");
			expect(result.code).not.toContain("@arkenv-preset-start");
			expect(result.code).toContain('DATABASE_URL: "string"');
		});

		it("removes all role-suffixed blocks matching baseId", () => {
			const initialContent = dedent`
				export const env = arkenv({
					PORT: "number.port = 3000",
					// @arkenv-preset-start vercel:client
					NEXT_PUBLIC_VERCEL_ENV: "string?",
					// @arkenv-preset-end vercel:client
					// @arkenv-preset-start vercel:server
					VERCEL: "string?",
					// @arkenv-preset-end vercel:server
				});
			`;

			const result = removePresetFromSchema(initialContent, {
				preset: "vercel",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).not.toContain("vercel");
			expect(result.code).toContain('PORT: "number.port = 3000"');
		});

		it("returns updated: false when preset is not in schema", () => {
			const initialContent = dedent`
				export const env = arkenv({
					PORT: "number.port = 3000",
				});
			`;

			const result = removePresetFromSchema(initialContent, {
				preset: "vercel",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("fails closed on malformed markers during remove", () => {
			const initialContent = dedent`
				export const env = arkenv({
					// @arkenv-preset-start vercel
					VERCEL: "string?",
				});
			`;

			const result = removePresetFromSchema(initialContent, {
				preset: "vercel",
			});
			expect(result.success).toBe(false);
			expect(result.error).toContain("Malformed preset markers");
		});

		it("preserves other presets when removing one preset", () => {
			const initialContent = dedent`
				export const env = arkenv({
					DATABASE_URL: "string",
					// @arkenv-preset-start vercel
					VERCEL: "string?",
					// @arkenv-preset-end vercel
					// @arkenv-preset-start netlify
					NETLIFY: "string?",
					// @arkenv-preset-end netlify
				});
			`;

			const result = removePresetFromSchema(initialContent, {
				preset: "vercel",
			});
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).not.toContain("VERCEL");
			expect(result.code).toContain("NETLIFY");
			expect(result.code).toContain("// @arkenv-preset-start netlify");
		});

		it("mutates SharedSchema exported as z.object", () => {
			const initialContent = dedent`
				import { z } from "zod";

				export const SharedSchema = z.object({
					DATABASE_URL: z.string(),
				});
			`;

			const result = mutateEnvConfig(
				initialContent,
				"vercel",
				"nextjs",
				"zod",
				["NEXT_PUBLIC_VERCEL_ENV"],
			);
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain(
				'NEXT_PUBLIC_VERCEL_ENV: z.enum(["production", "preview", "development"]).optional()',
			);
			expect(result.code).not.toContain("VERCEL: z.string().optional()");
		});

		it("mutates SharedSchema exported as v.object", () => {
			const initialContent = dedent`
				import * as v from "valibot";

				export const SharedSchema = v.object({
					DATABASE_URL: v.string(),
				});
			`;

			const result = mutateEnvConfig(
				initialContent,
				"vercel",
				"nextjs",
				"valibot",
				["NEXT_PUBLIC_VERCEL_ENV"],
			);
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain(
				'NEXT_PUBLIC_VERCEL_ENV: v.optional(v.picklist(["production", "preview", "development"]))',
			);
			expect(result.code).not.toContain("VERCEL: v.optional(v.string())");
		});

		it("mutates single-line arkenv({}) schema without corrupting output", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";
				export const env = arkenv({});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
				markerId: "vercel:client",
				targetKeys: ["NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_VERCEL_URL"],
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toBe(dedent`
				import arkenv from "./generated/env.gen";
				export const env = arkenv({
					// @arkenv-preset-start vercel:client
					NEXT_PUBLIC_VERCEL_ENV: "'production' | 'preview' | 'development'?",
					NEXT_PUBLIC_VERCEL_URL: "string?",
					// @arkenv-preset-end vercel:client
				});
			`);
		});

		it("mutates single-line schema with existing properties and detects collisions", () => {
			const initialContent =
				'export const Env = type({ DATABASE_URL: "string" });';

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "vanilla",
				validator: "arktype",
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('DATABASE_URL: "string",');
			expect(result.code).toContain("// @arkenv-preset-start vercel");
			expect(result.code).toContain('VERCEL: "string?",');
			expect(result.code).toContain("// @arkenv-preset-end vercel");

			// Collision on single-line schema
			const collisionContent = 'export const Env = type({ VERCEL: "string" });';
			const collisionResult = applyPresetToSchema(collisionContent, {
				preset: "vercel",
				framework: "vanilla",
				validator: "arktype",
			});
			expect(collisionResult.success).toBe(false);
			expect(collisionResult.error).toContain("Collision detected");
		});

		it("handles inline comments containing braces correctly without truncating range", () => {
			const initialContent = dedent`
				import arkenv from "@arkenv/core";

				export const env = arkenv({
					DATABASE_URL: "string", // comment with } brace
					PORT: "number.port = 3000",
					VERCEL: "string?",
				});
			`;

			// Collision check should find VERCEL even though previous line comment had '}'
			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "vanilla",
				validator: "arktype",
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("Collision detected");
			expect(result.error).toContain("VERCEL");
		});

		it("handles string and template literals containing braces correctly", () => {
			const initialContent = dedent`
				import arkenv from "@arkenv/core";

				export const env = arkenv({
					PATTERN: "'{id}'",
					ANOTHER: '"{test}"',
					PORT: "number.port = 3000",
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "vanilla",
				validator: "arktype",
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain("// @arkenv-preset-start vercel");
			expect(result.code).toContain('PORT: "number.port = 3000",');
			expect(result.code).toContain("// @arkenv-preset-end vercel");
		});

		it("mutates multiline arkenv(\\n  { ... }\\n) schema as emitted by strict init", () => {
			const initialContent = `import arkenv from "@arkenv/nextjs/client";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	{
		NEXT_PUBLIC_URL: "string",
	},
	{
		extends: [SharedSchema],
	},
);`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
				markerId: "vercel:client",
				targetKeys: ["NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_VERCEL_URL"],
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toBe(`import arkenv from "@arkenv/nextjs/client";
import { SharedSchema } from "./internal/shared";

export const env = arkenv(
	{
		NEXT_PUBLIC_URL: "string",
		// @arkenv-preset-start vercel:client
		NEXT_PUBLIC_VERCEL_ENV: "'production' | 'preview' | 'development'?",
		NEXT_PUBLIC_VERCEL_URL: "string?",
		// @arkenv-preset-end vercel:client
	},
	{
		extends: [SharedSchema],
	},
);`);
		});

		it("fails closed on multi-line schema when colliding key is a second field on the same line", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					PORT: "number.port = 3000",
					FOO: "string", VERCEL: "string?",
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});

			expect(result.success).toBe(false);
			expect(result.updated).toBe(false);
			expect(result.error).toContain("Collision detected");
			expect(result.error).toContain("VERCEL");
		});

		it("fails closed on multi-line schema when colliding key is on the same line inside another preset block", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					PORT: "number.port = 3000",
					// @arkenv-preset-start other
					OTHER_KEY: "string", VERCEL: "string?",
					// @arkenv-preset-end other
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});

			expect(result.success).toBe(false);
			expect(result.updated).toBe(false);
			expect(result.error).toContain("Collision detected");
			expect(result.error).toContain("other");
		});

		it("fails closed when preset marker is missing an id", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					// @arkenv-preset-start
					VERCEL: "string?",
					// @arkenv-preset-end
				});
			`;

			const result = validateAndFindPresetBlocks(initialContent);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Malformed preset markers");
				expect(result.error).toContain("missing or invalid preset id");
			}

			const applyResult = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});
			expect(applyResult.success).toBe(false);
			expect(applyResult.error).toContain("Malformed preset markers");
		});

		it("inserts trailing comma before line comment when last field has trailing comment without comma", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					PORT: "number.port = 3000" // tune
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('PORT: "number.port = 3000", // tune');
			expect(result.code).not.toContain("// tune,");
			expect(result.code).toContain("// @arkenv-preset-start vercel");
		});

		it("inserts trailing comma before block comment when last field has block comment without comma", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					PORT: "number.port = 3000" /* tune */
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('PORT: "number.port = 3000", /* tune */');
			expect(result.code).toContain("// @arkenv-preset-start vercel");
		});

		it("does not duplicate trailing comma when last field already has comma before comment", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					PORT: "number.port = 3000", // tune
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('PORT: "number.port = 3000", // tune');
			expect(result.code).not.toContain('PORT: "number.port = 3000",,');
		});

		it("correctly ignores slashes in string literals when finding trailing comments", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					API_URL: "https://api.example.com"
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('API_URL: "https://api.example.com",');
			expect(result.code).toContain("// @arkenv-preset-start vercel");
		});

		it("adds trailing comma to last field when comment lines exist before closing brace", () => {
			const initialContent = dedent`
				import arkenv from "./generated/env.gen";

				export const env = arkenv({
					PORT: "number.port = 3000"
					// comment before closing brace
				});
			`;

			const result = applyPresetToSchema(initialContent, {
				preset: "vercel",
				framework: "nextjs",
				validator: "arktype",
			});

			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain('PORT: "number.port = 3000",');
			expect(result.code).toContain("// @arkenv-preset-start vercel");
		});
	});
});
