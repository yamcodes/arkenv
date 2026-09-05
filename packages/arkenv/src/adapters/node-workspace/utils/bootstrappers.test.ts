import dedent from "dedent";
import { describe, expect, it } from "vitest";
import {
	transformNextjsConfig,
	transformNuxtConfig,
	transformRsbuildConfig,
	transformViteConfig,
} from "./bootstrappers";

describe("bootstrappers", () => {
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

		it("preserves space indentation format", () => {
			const initialContent =
				'import { defineConfig } from "vite";\n\nexport default defineConfig({\n  plugins: [],\n});\n';
			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("  plugins: [arkenvVitePlugin()]");
			expect(result.code?.endsWith("\n")).toBe(true);
		});

		it("preserves tab indentation format", () => {
			const initialContent =
				'import { defineConfig } from "vite";\n\nexport default defineConfig({\n\tplugins: [],\n});\n';
			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("\tplugins: [arkenvVitePlugin()]");
		});

		it("preserves absence of trailing newline", () => {
			const initialContent = "export default { plugins: [] }";
			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code?.endsWith("\n")).toBe(false);
		});

		it("refuses defineConfig callback form with an actionable message", () => {
			const initialContent =
				'import { defineConfig } from "vite";\nexport default defineConfig((env) => ({\n  plugins: [],\n}));';
			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"The 'defineConfig' callback form is currently not supported",
				);
			}
		});

		it("fails when default export is not an object", () => {
			const initialContent = "export default 123;";
			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"Could not find default export object in Vite config",
				);
			}
		});

		it("fails when plugins property is not an array", () => {
			const initialContent = 'export default { plugins: "not-an-array" };';
			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"The 'plugins' property in your Vite config is not an array",
				);
			}
		});

		it("fails gracefully on invalid syntax", () => {
			const result = transformViteConfig({ code: "const invalid = {" });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Failed to parse Vite config");
			}
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
	});

	describe("transformNextjsConfig", () => {
		it("wraps default export with withArkEnv", async () => {
			const initialContent = dedent`
				const nextConfig = {
					reactStrictMode: true
				}
				export default nextConfig
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain(
				'import { withArkEnv } from "@arkenv/nextjs/config"',
			);
			expect(result.code).toContain("export default withArkEnv(nextConfig)");
		});

		it("supports disableCodegen option", async () => {
			const initialContent = dedent`
				export default {
					reactStrictMode: true
				}
			`;

			const result = transformNextjsConfig({
				code: initialContent,
				disableCodegen: true,
			});
			expect(result.success).toBe(true);
			expect(result.code).toContain(
				'import { withArkEnv } from "@arkenv/nextjs/config"',
			);
			expect(result.code).toContain("withArkEnv({");
			expect(result.code).toContain("codegen: false");
		});

		it("refuses CommonJS module.exports", () => {
			const initialContent = "module.exports = { reactStrictMode: true };";
			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"CommonJS is not supported for automatic mutation",
				);
			}
		});

		it("fails when missing default export", () => {
			const initialContent = "export const foo = 123;";
			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"Could not find default export in Next.js config",
				);
			}
		});

		it("does not duplicate if already wrapped with withArkEnv AST", async () => {
			const initialContent = dedent`
				import { withArkEnv } from "@arkenv/nextjs/config"
				export default withArkEnv({
					reactStrictMode: true
				})
			`;

			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("does not duplicate if withArkEnv is referenced inline or elsewhere", () => {
			const initialContent =
				"const wrapped = withArkEnv(config);\nexport default wrapped;";
			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("preserves trailing newline", () => {
			const initialContent = "export default {};\n";
			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code?.endsWith("\n")).toBe(true);
		});

		it("preserves absence of trailing newline", () => {
			const initialContent = "export default {}";
			const result = transformNextjsConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code?.endsWith("\n")).toBe(false);
		});

		it("fails gracefully on invalid syntax", () => {
			const result = transformNextjsConfig({ code: "export default {" });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Failed to parse Next.js config");
			}
		});
	});

	describe("transformNuxtConfig", () => {
		it("adds nuxt module to defineNuxtConfig", async () => {
			const initialContent = dedent`
				export default defineNuxtConfig({
					modules: []
				})
			`;

			const result = transformNuxtConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain('"@arkenv/nuxt/module"');
		});

		it("creates modules array if missing in defineNuxtConfig", () => {
			const initialContent =
				"export default defineNuxtConfig({\n  ssr: true,\n});\n";
			const result = transformNuxtConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain('"@arkenv/nuxt/module"');
		});

		it("adds nuxt module to simple object export", () => {
			const initialContent = "export default { ssr: true };";
			const result = transformNuxtConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain('"@arkenv/nuxt/module"');
		});

		it("does not duplicate nuxt module if already present", async () => {
			const initialContent = dedent`
				export default defineNuxtConfig({
					modules: ["@arkenv/nuxt/module"]
				})
			`;

			const result = transformNuxtConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("fails when modules is not an array", () => {
			const initialContent =
				'export default defineNuxtConfig({ modules: "invalid" });';
			const result = transformNuxtConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"The 'modules' property in your Nuxt config is not an array",
				);
			}
		});

		it("fails when default export is not an object", () => {
			const initialContent = "export default 42;";
			const result = transformNuxtConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"Could not find default export object in Nuxt config",
				);
			}
		});

		it("fails gracefully on invalid syntax", () => {
			const result = transformNuxtConfig({
				code: "export default defineNuxtConfig({",
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Failed to parse Nuxt config");
			}
		});

		it("preserves trailing newline", () => {
			const initialContent = "export default defineNuxtConfig({});\n";
			const result = transformNuxtConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code?.endsWith("\n")).toBe(true);
		});
	});

	describe("transformRsbuildConfig", () => {
		it("injects plugin into a standard rsbuild.config.ts", async () => {
			const initialContent = dedent`
				import { defineConfig } from "@rsbuild/core"
				export default defineConfig({
					plugins: []
				})
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);

			expect(result.code).toContain(
				'import { arkenvRsbuildPlugin } from "@arkenv/rsbuild-plugin"',
			);
			expect(result.code).toContain("arkenvRsbuildPlugin()");
		});

		it("injects plugin into a simple object export", async () => {
			const initialContent = dedent`
				export default {
					plugins: []
				}
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("arkenvRsbuildPlugin()");
		});

		it("handles missing plugins array", async () => {
			const initialContent = dedent`
				export default {
					server: {}
				}
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("plugins: [");
			expect(result.code).toContain("arkenvRsbuildPlugin()");
		});

		it("preserves space indentation format", () => {
			const initialContent =
				'import { defineConfig } from "@rsbuild/core";\n\nexport default defineConfig({\n  plugins: [],\n});\n';
			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("  plugins: [arkenvRsbuildPlugin()]");
			expect(result.code?.endsWith("\n")).toBe(true);
		});

		it("preserves tab indentation format", () => {
			const initialContent =
				'import { defineConfig } from "@rsbuild/core";\n\nexport default defineConfig({\n\tplugins: [],\n});\n';
			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code).toContain("\tplugins: [arkenvRsbuildPlugin()]");
		});

		it("preserves absence of trailing newline", () => {
			const initialContent = "export default { plugins: [] }";
			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.code?.endsWith("\n")).toBe(false);
		});

		it("refuses defineConfig callback form with an actionable message", () => {
			const initialContent =
				'import { defineConfig } from "@rsbuild/core";\nexport default defineConfig((env) => ({\n  plugins: [],\n}));';
			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"The 'defineConfig' callback form is currently not supported",
				);
			}
		});

		it("fails when default export is not an object", () => {
			const initialContent = "export default 123;";
			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"Could not find default export object in Rsbuild config",
				);
			}
		});

		it("fails when plugins property is not an array", () => {
			const initialContent = "export default { plugins: 123 };";
			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain(
					"The 'plugins' property in your Rsbuild config is not an array",
				);
			}
		});

		it("does not duplicate plugin if already exists and returns updated: false", async () => {
			const initialContent = dedent`
				import { arkenvRsbuildPlugin } from "@arkenv/rsbuild-plugin"
				export default {
					plugins: [arkenvRsbuildPlugin()]
				}
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("is idempotent when arkenvRsbuildPlugin is aliased in the import", async () => {
			const initialContent = dedent`
				import { arkenvRsbuildPlugin as myPlugin } from "@arkenv/rsbuild-plugin"
				export default {
					plugins: [myPlugin()]
				}
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("returns updated: true when plugin is injected", async () => {
			const initialContent = dedent`
				export default {
					plugins: []
				}
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
		});

		it("injects plugin into plugins array even if import already exists but is unregistered", async () => {
			const initialContent = dedent`
				import { arkenvRsbuildPlugin } from "@arkenv/rsbuild-plugin"
				export default {
					plugins: []
				}
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain("plugins: [arkenvRsbuildPlugin()]");
		});

		it("injects aliased plugin call when an unregistered aliased import exists", async () => {
			const initialContent = dedent`
				import { arkenvRsbuildPlugin as customPlugin } from "@arkenv/rsbuild-plugin"
				export default {
					plugins: []
				}
			`;

			const result = transformRsbuildConfig({ code: initialContent });
			expect(result.success).toBe(true);
			expect(result.updated).toBe(true);
			expect(result.code).toContain("plugins: [customPlugin()]");
			expect(result.code).not.toContain("arkenvRsbuildPlugin()");
		});
	});
});
