import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Workspace } from "./workspace";

describe("Workspace", () => {
	let tempDir: string;
	let workspace: Workspace;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(
			path.join(os.tmpdir(), "arkenv-workspace-test-"),
		);
		workspace = new Workspace({ cwd: tempDir });
	});

	afterEach(async () => {
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	it("resolves paths correctly", () => {
		expect(workspace.resolve("test.txt")).toBe(path.join(tempDir, "test.txt"));
	});

	it("detects existence of files", async () => {
		await fsp.writeFile(path.join(tempDir, "exists.txt"), "hello");
		expect(await workspace.exists("exists.txt")).toBe(true);
		expect(await workspace.exists("missing.txt")).toBe(false);
	});

	it("reads and writes files", async () => {
		await workspace.writeFile("test.txt", "content");
		expect(await workspace.readFile("test.txt")).toBe("content");
	});

	it("creates directories recursively when writing files", async () => {
		await workspace.writeFile("deep/dir/test.txt", "content");
		expect(await workspace.readFile("deep/dir/test.txt")).toBe("content");
	});

	it("detects framework from package.json", async () => {
		await workspace.writeFile(
			"package.json",
			JSON.stringify({ dependencies: { vite: "*" } }),
		);
		expect(await workspace.detectFramework()).toBe("vite");

		await workspace.writeFile(
			"package.json",
			JSON.stringify({ dependencies: { bun: "*" } }),
		);
		expect(await workspace.detectFramework()).toBe("bun");
	});

	it("detects framework from config files", async () => {
		await workspace.writeFile("vite.config.ts", "");
		expect(await workspace.detectFramework()).toBe("vite");
	});

	it("updates tsconfig property", async () => {
		const tsconfig = { compilerOptions: { strict: false } };
		await workspace.writeFile(
			"tsconfig.json",
			JSON.stringify(tsconfig, null, 2),
		);

		const result = await workspace.setTsConfigProperty(
			["compilerOptions", "strict"],
			true,
		);
		expect(result.status).toBe("updated");

		const updated = JSON.parse(await workspace.readFile("tsconfig.json"));
		expect(updated.compilerOptions.strict).toBe(true);
	});

	it("ensures vite plugin injection", async () => {
		const viteConfig = `
			import { defineConfig } from 'vite'
			export default defineConfig({
				plugins: []
			})
		`;
		await workspace.writeFile("vite.config.ts", viteConfig);

		const result = await workspace.ensureVitePlugin("myPlugin", {
			importFrom: "my-plugin-pkg",
		});

		expect(result.success).toBe(true);
		expect(result.updated).toBe(true);

		const code = await workspace.readFile("vite.config.ts");
		expect(code).toContain("myPlugin");
		expect(code).toContain("my-plugin-pkg");
		expect(code).toContain("myPlugin()");
	});

	it("is idempotent when ensuring vite plugin", async () => {
		const viteConfig = `
			import { defineConfig } from 'vite'
			import myPlugin from "my-plugin-pkg"
			export default defineConfig({
				plugins: [myPlugin()]
			})
		`;
		await workspace.writeFile("vite.config.ts", viteConfig);

		const result = await workspace.ensureVitePlugin("myPlugin", {
			importFrom: "my-plugin-pkg",
		});

		expect(result.success).toBe(true);
		expect(result.updated).toBe(false);
	});
});
