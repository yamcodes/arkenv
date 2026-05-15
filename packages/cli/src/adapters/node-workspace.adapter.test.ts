import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import dedent from "dedent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeWorkspace, Workspace } from "@/adapters/node-workspace.adapter";

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
});
