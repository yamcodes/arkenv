import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapViteConfig, findViteConfig } from "./config-mutation";

describe("config-mutation", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(
			path.join(os.tmpdir(), "arkenv-mutation-test-"),
		);
		vi.spyOn(process, "cwd").mockReturnValue(tempDir);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	describe("findViteConfig", () => {
		it("finds vite.config.ts", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			await fsp.writeFile(configPath, "");
			const result = await findViteConfig();
			expect(result).toBe(configPath);
		});

		it("returns null if no config exists", async () => {
			const result = await findViteConfig();
			expect(result).toBeNull();
		});
	});

	describe("bootstrapViteConfig", () => {
		it("injects plugin into a standard vite.config.ts", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
`.trim();
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success, result.error).toBe(true);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			expect(updatedContent).toContain("arkenvVitePlugin");
			expect(updatedContent).toContain("@arkenv/vite-plugin");
		});

		it("injects plugin with Env when envImportPath is provided", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `
import { defineConfig } from 'vite'
export default defineConfig({
  plugins: []
})
`.trim();
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath, "./env");
			expect(result.success, result.error).toBe(true);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			expect(updatedContent).toContain("arkenvVitePlugin");
			expect(updatedContent).toContain("@arkenv/vite-plugin");
			expect(updatedContent).toContain("Env");
			expect(updatedContent).toContain("arkenvVitePlugin(Env)");
		});

		it("injects plugin into a simple object export", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `
export default {
  plugins: []
}
`.trim();
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success, result.error).toBe(true);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			expect(updatedContent).toContain("arkenvVitePlugin");
		});

		it("handles missing plugins array", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `
export default {
}
`.trim();
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success, result.error).toBe(true);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			expect(updatedContent).toContain("plugins");
			expect(updatedContent).toContain("arkenvVitePlugin");
		});

		it("does not duplicate plugin if already exists", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `
import arkenvVitePlugin from "@arkenv/vite-plugin"
export default {
  plugins: [arkenvVitePlugin()]
}
`.trim();
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success, result.error).toBe(true);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			const matches = updatedContent.match(/arkenvVitePlugin/g);
			// One in import, one in plugins
			expect(matches?.length).toBe(2);
		});

		it("returns failure for invalid/too complex config", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `
// Not a standard config
const config = {};
if (Math.random() > 0.5) {
  config.plugins = [];
}
export default config;
`.trim();
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});
});
