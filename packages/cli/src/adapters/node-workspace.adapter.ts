import { type StdioOptions, spawn } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import dedent from "dedent";
import { applyEdits, modify } from "jsonc-parser";
import pc from "picocolors";
import { transformViteConfig } from "../features/config-mutation/config-mutation";
import { updateTsConfigToStrict } from "../features/scaffold/scaffold";
import type { WorkspacePort } from "../shared/ports/workspace.port";

export type Framework = "vite" | "bun" | "node";

export type WorkspaceOptions = {
	cwd?: string;
};

export class Workspace {
	private cwd: string;

	constructor(options: WorkspaceOptions = {}) {
		this.cwd = options.cwd || process.cwd();
	}

	resolve(...paths: string[]) {
		return path.resolve(this.cwd, ...paths);
	}

	async exists(filePath: string) {
		try {
			await fsp.access(this.resolve(filePath));
			return true;
		} catch {
			return false;
		}
	}

	async readFile(filePath: string) {
		return fsp.readFile(this.resolve(filePath), "utf-8");
	}

	async writeFile(filePath: string, content: string) {
		const fullPath = this.resolve(filePath);
		await fsp.mkdir(path.dirname(fullPath), { recursive: true });
		await fsp.writeFile(fullPath, content, "utf-8");
	}

	async detectFramework(): Promise<Framework> {
		try {
			const content = await this.readFile("package.json");
			const pkg = JSON.parse(content);
			const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

			if (allDeps.vite) return "vite";
			if (allDeps["@types/bun"] || allDeps.bun) return "bun";
		} catch {
			// ignore missing or invalid package.json
		}

		// Check for config files
		if (
			(await this.exists("vite.config.ts")) ||
			(await this.exists("vite.config.js")) ||
			(await this.exists("vite.config.mts")) ||
			(await this.exists("vite.config.mjs"))
		) {
			return "vite";
		}

		// Check for bun runtime
		if ("bun" in process.versions) return "bun";

		return "node";
	}

	async setTsConfigProperty(propertyPath: string[], value: any) {
		const tsConfigPath = await this.findTsConfig();
		if (!tsConfigPath) return { status: "not_found" };

		try {
			const content = await this.readFile(tsConfigPath);
			const edits = modify(content, propertyPath, value, {
				formattingOptions: { insertSpaces: true, tabSize: 2 },
			});
			const updated = applyEdits(content, edits);

			await this.writeFile(tsConfigPath, updated);
			return { status: "updated", file: path.basename(tsConfigPath) };
		} catch {
			return { status: "error", file: path.basename(tsConfigPath) };
		}
	}

	async findTsConfig(): Promise<string | null> {
		const filenames = [
			"tsconfig.app.json",
			"tsconfig.json",
			"tsconfig.base.json",
			"tsconfig.node.json",
		];
		let currentDir = this.cwd;
		let isRoot = false;

		do {
			isRoot = currentDir === path.parse(currentDir).root;
			for (const file of filenames) {
				const fullPath = path.join(currentDir, file);
				try {
					await fsp.access(fullPath);
					return fullPath;
				} catch {
					// intentionally ignore missing file
				}
			}
			currentDir = path.dirname(currentDir);
		} while (!isRoot);

		return null;
	}

	async findViteConfig(): Promise<string | null> {
		const filenames = [
			"vite.config.ts",
			"vite.config.js",
			"vite.config.mts",
			"vite.config.mjs",
		];
		for (const file of filenames) {
			if (await this.exists(file)) return this.resolve(file);
		}
		return null;
	}
}

export class NodeWorkspace implements WorkspacePort {
	constructor(
		private isQuiet: boolean,
		private stdio: StdioOptions,
	) {}

	async exists(path: string): Promise<boolean> {
		try {
			await fsp.access(path);
			return true;
		} catch {
			return false;
		}
	}

	async readFile(path: string): Promise<string> {
		return fsp.readFile(path, "utf-8");
	}

	async writeFile(path: string, content: string): Promise<void> {
		await fsp.writeFile(path, content, "utf-8");
	}

	async mkdir(path: string, recursive?: boolean): Promise<void> {
		await fsp.mkdir(path, { recursive });
	}

	async execute(command: string, args: string[] = []): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const child = spawn(command, args, {
				stdio: this.isQuiet ? "pipe" : this.stdio,
				shell: false,
			});

			let stdout = "";
			let stderr = "";
			const MAX_BUFFER = 10_000;

			if (this.isQuiet) {
				child.stdout?.on("data", (data) => {
					stdout = (stdout + data.toString()).slice(-MAX_BUFFER);
				});
				child.stderr?.on("data", (data) => {
					stderr = (stderr + data.toString()).slice(-MAX_BUFFER);
				});
			}

			child.on("close", (code, signal) => {
				if (code === 0) {
					resolve();
				} else {
					let message =
						code === null
							? `Command terminated by signal ${signal}`
							: `Command failed with code ${code}`;
					if (this.isQuiet) {
						if (stdout) message += `\n${pc.dim("STDOUT:")}\n${stdout}`;
						if (stderr) message += `\n${pc.red("STDERR:")}\n${stderr}`;
					}
					reject(new Error(message));
				}
			});

			child.on("error", reject);
		});
	}

	async updateTsConfigToStrict(path?: string) {
		return updateTsConfigToStrict(path);
	}

	async findViteConfig(): Promise<string | null> {
		const filenames = [
			"vite.config.ts",
			"vite.config.js",
			"vite.config.mts",
			"vite.config.mjs",
		];
		for (const file of filenames) {
			const fullPath = path.resolve(process.cwd(), file);
			try {
				await fsp.access(fullPath);
				return fullPath;
			} catch {
				// ignore missing file
			}
		}
		return null;
	}

	async findBunConfig(): Promise<string | null> {
		const filenames = ["bunfig.toml", "bun.setup.ts", "bun.setup.js"];
		for (const file of filenames) {
			const fullPath = path.resolve(process.cwd(), file);
			try {
				await fsp.access(fullPath);
				return fullPath;
			} catch {
				// ignore missing file
			}
		}
		return null;
	}

	async bootstrapViteConfig(path: string, importPath: string) {
		const code = await this.readFile(path);
		const result = transformViteConfig({ code, envImportPath: importPath });

		if (result.success && result.updated && result.code) {
			await this.writeFile(path, result.code);
		}

		return {
			success: result.success,
			updated: result.updated,
			error: result.error,
		};
	}

	async bootstrapBunConfig(configPath?: string | null) {
		if (configPath?.endsWith("bunfig.toml")) {
			return {
				success: true,
				instructions: dedent`
					[preload]
					preload = ["./bun.setup.ts"]
				`,
			};
		}

		if (
			configPath?.endsWith("bun.setup.ts") ||
			configPath?.endsWith("bun.setup.js")
		) {
			return {
				success: true,
				instructions: dedent`
					import arkenv from "@arkenv/bun-plugin";

					Bun.build({
					  // ... other config
					  plugins: [arkenv],
					});
				`,
			};
		}

		const instructions = dedent`
			To complete Bun integration, add the following to your setup/preload file:
			
			import arkenv from "@arkenv/bun-plugin";
			
			Bun.build({
			  // ... other config
			  plugins: [arkenv],
			});
			
			If you don't have a setup file, create one (e.g., bun.setup.ts) and add it to your bunfig.toml:
			
			[preload]
			preload = ["./bun.setup.ts"]
		`;

		return { success: true, instructions };
	}

	async safeAppend(
		path: string,
		schemaPath: string,
		framework: "vite" | "bun",
	) {
		const { safeAppend } = await import("./injection");
		return safeAppend(path, schemaPath, framework);
	}
}
