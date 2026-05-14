import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import dedent from "dedent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	bootstrapBunConfig,
	bootstrapViteConfig,
	findBunConfig,
	findViteConfig,
} from "./config-mutation";

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

	describe("findBunConfig", () => {
		it("finds bunfig.toml", async () => {
			const configPath = path.join(tempDir, "bunfig.toml");
			await fsp.writeFile(configPath, "");
			const result = await findBunConfig();
			expect(result).toBe(configPath);
		});

		it("finds bun.setup.ts", async () => {
			const configPath = path.join(tempDir, "bun.setup.ts");
			await fsp.writeFile(configPath, "");
			const result = await findBunConfig();
			expect(result).toBe(configPath);
		});

		it("returns null if no config exists", async () => {
			const result = await findBunConfig();
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

		it("does not duplicate plugin if already exists and returns updated: false", async () => {
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
			expect(result.updated).toBe(false);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			const matches = updatedContent.match(/arkenvVitePlugin/g);
			// One in import, one in plugins
			expect(matches?.length).toBe(2);
		});

		it("returns updated: true when plugin is injected", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `
import { defineConfig } from 'vite'
export default defineConfig({
  plugins: []
})
`.trim();
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success, result.error).toBe(true);
			expect(result.updated).toBe(true);
		});

		it("preserves original indentation", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = `export default {
    plugins: []
}
`; // 4-space indentation
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success, result.error).toBe(true);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			// If detected correctly, the indentation should be consistent.
			// Magicast might still use its default for new blocks if not fully compatible,
			// but we want to avoid the "excessive" indentation reported by the user.
			expect(updatedContent).toMatch(/ {4}plugins: \[/);
		});

		it("preserves tab indentation", async () => {
			const configPath = path.join(tempDir, "vite.config.ts");
			const initialContent = "export default {\n\tplugins: []\n}\n";
			await fsp.writeFile(configPath, initialContent);

			const result = await bootstrapViteConfig(configPath);
			expect(result.success, result.error).toBe(true);

			const updatedContent = await fsp.readFile(configPath, "utf-8");
			expect(updatedContent).toContain("\tplugins: [");
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

	describe("bootstrapBunConfig", () => {
		it("returns bunfig.toml specific instructions", async () => {
			const result = await bootstrapBunConfig("bunfig.toml");
			expect(result.success).toBe(true);
			expect(result.instructions).toBe(dedent`
				[preload]
				preload = ["./bun.setup.ts"]
			`);
		});

		it("returns bun.setup.ts specific instructions", async () => {
			const result = await bootstrapBunConfig("bun.setup.ts");
			expect(result.success).toBe(true);
			expect(result.instructions).toContain("import arkenv");
			expect(result.instructions).toContain("Bun.build");
			expect(result.instructions).toContain("plugins: [arkenv]");
			expect(result.instructions).not.toContain("add the following to your");
		});

		it("returns combined instructions when no config path is provided", async () => {
			const result = await bootstrapBunConfig(null);
			expect(result.success).toBe(true);
			expect(result.instructions).toContain("Bun.build");
			expect(result.instructions).toContain("[preload]");
			expect(result.instructions).toContain("add the following to your");
		});
	});
});
