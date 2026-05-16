import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import dedent from "dedent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeWorkspace } from ".";
import { NodeProjectScannerAdapter } from "../node-project-scanner";

describe("NodeWorkspace", () => {
	let tempDir: string;
	let workspace: NodeWorkspace;

	beforeEach(async () => {
		tempDir = await fsp.mkdtemp(
			path.join(os.tmpdir(), "arkenv-workspace-test-"),
		);
		workspace = new NodeWorkspace(true, "ignore");
		vi.spyOn(process, "cwd").mockReturnValue(tempDir);
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		await fsp.rm(tempDir, { recursive: true, force: true });
	});

	it("detects existence of files", async () => {
		await fsp.writeFile(path.join(tempDir, "exists.txt"), "hello");
		expect(await workspace.exists(path.join(tempDir, "exists.txt"))).toBe(true);
		expect(await workspace.exists(path.join(tempDir, "missing.txt"))).toBe(
			false,
		);
	});

	it("reads and writes files", async () => {
		const filePath = path.join(tempDir, "test.txt");
		await workspace.writeFile(filePath, "content");
		expect(await workspace.readFile(filePath)).toBe("content");
	});

	it("creates directories recursively when writing files", async () => {
		const dirPath = path.join(tempDir, "deep/dir");
		const filePath = path.join(dirPath, "test.txt");
		await workspace.mkdir(dirPath, true);
		await workspace.writeFile(filePath, "content");
		expect(await workspace.readFile(filePath)).toBe("content");
	});

	it("detects framework from package.json", async () => {
		const pkgPath = path.join(tempDir, "package.json");
		await workspace.writeFile(
			pkgPath,
			JSON.stringify({ dependencies: { vite: "*" } }),
		);
		const helper = new NodeProjectScannerAdapter();
		const framework = await helper.detectFramework(tempDir);
		expect(framework).toBe("vite");
	});

	it("asserts detection priority when both package.json and config files exist", async () => {
		const pkgPath = path.join(tempDir, "package.json");
		await fsp.writeFile(
			pkgPath,
			JSON.stringify({ dependencies: { vite: "*" } }),
		);
		await fsp.writeFile(path.join(tempDir, "bun.config.js"), "");

		const scanner = new NodeProjectScannerAdapter();
		const framework = await scanner.detectFramework(tempDir);
		expect(framework).toBe("vite");
	});

	it("handles error when reading a non-existent file", async () => {
		await expect(workspace.readFile("non-existent.txt")).rejects.toThrow();
	});

	it("handles error when writing to a read-only directory", async () => {
		const roDir = path.join(tempDir, "readonly");
		await fsp.mkdir(roDir);
		await fsp.chmod(roDir, 0o444);
		const filePath = path.join(roDir, "test.txt");
		await expect(workspace.writeFile(filePath, "content")).rejects.toThrow();
		await fsp.chmod(roDir, 0o755); // Cleanup for afterEach
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

		const result = await workspace.bootstrapViteConfig(configPath, "./env");
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

		const result = await workspace.bootstrapViteConfig(configPath, "./env");
		expect(result.success).toBe(true);
		expect(result.updated).toBe(false);
	});

	it("returns instructions for bunfig.toml", async () => {
		const result = await workspace.bootstrapBunConfig("bunfig.toml");
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.instructions).toContain("[preload]");
		}
	});

	it("handles execute failures with output", async () => {
		const scriptPath = path.join(tempDir, "fail.sh");
		await fsp.writeFile(
			scriptPath,
			"#!/bin/sh\necho 'hello error' >&2\nexit 1",
		);
		await fsp.chmod(scriptPath, 0o755);

		const pipeWorkspace = new NodeWorkspace(true, "pipe");
		await expect(pipeWorkspace.execute(scriptPath)).rejects.toThrow(
			/Command failed with code 1/,
		);
	});

	it("finds vite config files", async () => {
		await fsp.writeFile(path.join(tempDir, "vite.config.mts"), "");
		const found = await workspace.findViteConfig();
		expect(found).toContain("vite.config.mts");
	});

	it("finds bun config files", async () => {
		await fsp.writeFile(path.join(tempDir, "bunfig.toml"), "");
		const found = await workspace.findBunConfig();
		expect(found).toContain("bunfig.toml");
	});
});
