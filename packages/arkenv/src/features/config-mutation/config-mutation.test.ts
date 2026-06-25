import dedent from "dedent";
import { describe, expect, it } from "vitest";
import { transformNextjsConfig, transformViteConfig } from "./config-mutation";

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
			expect(result.success).toBe(true);

			expect(result.code).toContain(
				'import arkenvVitePlugin from "@arkenv/vite-plugin"',
			);
			expect(result.code).toContain('import { Env } from "./env"');
			expect(result.code).toContain("arkenvVitePlugin(Env)");
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
	});
});
