import dedent from "dedent";
import { describe, expect, it } from "vitest";
import {
	transformNextjsConfig,
	transformNuxtConfig,
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

		it("does not duplicate if already wrapped", async () => {
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
	});
});
