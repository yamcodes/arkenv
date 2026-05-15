import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import dedent from "dedent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeWorkspace, Workspace } from ".";

describe("Workspace", () => {
	let tempDir: string;
	let workspace: Workspace;
	let nodeWorkspace: NodeWorkspace;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(
			path.join(os.tmpdir(), "arkenv-workspace-test-"),
		);
		workspace = new Workspace({ cwd: tempDir });
		nodeWorkspace = new NodeWorkspace(true, "ignore");
		vi.spyOn(process, "cwd").mockReturnValue(tempDir);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
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
		const viteConfig = dedent`
			import { defineConfig } from "vite"
			export default defineConfig({
				plugins: []
			})
		`;
		const configPath = path.join(tempDir, "vite.config.ts");
		await fsp.writeFile(configPath, viteConfig);

		const result = await nodeWorkspace.bootstrapViteConfig(configPath, "./env");
		expect(result.success).toBe(true);
		expect(result.updated).toBe(true);

		const updated = await fsp.readFile(configPath, "utf-8");
		expect(updated).toContain(
			'import arkenvVitePlugin from "@arkenv/vite-plugin"',
		);
		expect(updated).toContain("arkenvVitePlugin(Env)");
	});

	it("is idempotent when ensuring vite plugin", async () => {
		const viteConfig = dedent`
			import arkenvVitePlugin from "@arkenv/vite-plugin"
			export default {
				plugins: [arkenvVitePlugin()]
			}
		`;
		const configPath = path.join(tempDir, "vite.config.ts");
		await fsp.writeFile(configPath, viteConfig);

		const result = await nodeWorkspace.bootstrapViteConfig(configPath, "./env");
		expect(result.success).toBe(true);
		expect(result.updated).toBe(false);
	});

	it("returns instructions for bunfig.toml", async () => {
		const result = await nodeWorkspace.bootstrapBunConfig("bunfig.toml");
		expect(result.success).toBe(true);
		expect(result.instructions).toContain("[preload]");
	});

	it("returns instructions for bun.setup.ts", async () => {
		const result = await nodeWorkspace.bootstrapBunConfig("bun.setup.ts");
		expect(result.success).toBe(true);
		expect(result.instructions).toContain("@arkenv/bun-plugin");
	});

	it("returns generic bun instructions for unknown config", async () => {
		const result = await nodeWorkspace.bootstrapBunConfig(null);
		expect(result.success).toBe(true);
		expect(result.instructions).toContain("bun.setup.ts");
	});

	it("handles execute failures with output", async () => {
		// Create a failing script
		const scriptPath = path.join(tempDir, "fail.sh");
		await fsp.writeFile(
			scriptPath,
			"#!/bin/sh\necho 'hello error' >&2\nexit 1",
		);
		await fsp.chmod(scriptPath, 0o755);

		const quietWorkspace = new NodeWorkspace(true, "pipe");
		await expect(quietWorkspace.execute(scriptPath)).rejects.toThrow(
			/Command failed with code 1/,
		);
	});

	it("finds vite config files", async () => {
		await fsp.writeFile(path.join(tempDir, "vite.config.mts"), "");
		const found = await nodeWorkspace.findViteConfig();
		expect(found).toContain("vite.config.mts");
	});

	it("finds bun config files", async () => {
		await fsp.writeFile(path.join(tempDir, "bunfig.toml"), "");
		const found = await nodeWorkspace.findBunConfig();
		expect(found).toContain("bunfig.toml");
	});
});
