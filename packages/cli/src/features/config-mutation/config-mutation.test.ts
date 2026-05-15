import dedent from "dedent";
import { describe, expect, it } from "vitest";
import { transformViteConfig } from "./config-mutation";

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
			expect(result.success, result.error).toBe(true);

			expect(result.code).toContain(
				'import arkenvVitePlugin from "@arkenv/vite-plugin"',
			);
			expect(result.code).toContain("arkenvVitePlugin()");
		});

		it("injects plugin with Env when envImportPath is provided", async () => {
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
			expect(result.success, result.error).toBe(true);

			expect(result.code).toContain(
				'import arkenvVitePlugin from "@arkenv/vite-plugin"',
			);
			expect(result.code).toContain('import {Env} from "./env"');
			expect(result.code).toContain("arkenvVitePlugin(Env)");
		});

		it("injects plugin into a simple object export", async () => {
			const initialContent = dedent`
				export default {
					plugins: []
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success, result.error).toBe(true);
			expect(result.code).toContain("arkenvVitePlugin()");
		});

		it("handles missing plugins array", async () => {
			const initialContent = dedent`
				export default {
					build: {}
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success, result.error).toBe(true);
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
			expect(result.success, result.error).toBe(true);
			expect(result.updated).toBe(false);
		});

		it("returns updated: true when plugin is injected", async () => {
			const initialContent = dedent`
				export default {
					plugins: []
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success, result.error).toBe(true);
			expect(result.updated).toBe(true);
		});

		it("preserves original indentation", async () => {
			const initialContent = dedent`
				export default {
				    plugins: []
				}
			`;

			const result = transformViteConfig({ code: initialContent });
			expect(result.success, result.error).toBe(true);
			expect(result.code).toContain("    plugins: [");
		});

		it("preserves tab indentation", async () => {
			const initialContent = "export default {\n\tplugins: []\n}";

			const result = transformViteConfig({ code: initialContent });
			expect(result.success, result.error).toBe(true);
			expect(result.code).toContain("\tplugins: [");
		});

		it("returns failure for invalid/too complex config", async () => {
			const initialContent = "export default someFunction()";

			const result = transformViteConfig({ code: initialContent });
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});
});
