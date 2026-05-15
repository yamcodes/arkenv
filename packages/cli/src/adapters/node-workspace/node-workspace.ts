import { type StdioOptions, spawn } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import dedent from "dedent";
import pc from "picocolors";
import { transformViteConfig } from "@/features/config-mutation";
import { updateTsConfigToStrict } from "@/features/scaffold";
import type { WorkspacePort } from "@/shared/ports";

export class NodeWorkspace implements WorkspacePort {
	constructor(
		private isQuiet: boolean,
		private stdio:
			| "inherit"
			| "ignore"
			| "pipe"
			| readonly (object | number | string | null | undefined)[],
	) {}

	async exists(filePath: string): Promise<boolean> {
		try {
			await fsp.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	async readFile(filePath: string): Promise<string> {
		return fsp.readFile(filePath, "utf-8");
	}

	async writeFile(filePath: string, content: string): Promise<void> {
		await fsp.writeFile(filePath, content, "utf-8");
	}

	async mkdir(dirPath: string, recursive?: boolean): Promise<void> {
		await fsp.mkdir(dirPath, { recursive });
	}

	async execute(command: string, args: string[] = []): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const child = spawn(command, args, {
				stdio: (this.isQuiet ? "pipe" : this.stdio) as StdioOptions,
				shell: false,
			});

			let stdout = "";
			let stderr = "";
			const MAX_BUFFER = 10_000;

			if (this.isQuiet) {
				child.stdout?.on("data", (data: Buffer) => {
					stdout = (stdout + data.toString()).slice(-MAX_BUFFER);
				});
				child.stderr?.on("data", (data: Buffer) => {
					stderr = (stderr + data.toString()).slice(-MAX_BUFFER);
				});
			}

			child.on("close", (code: number | null, signal: string | null) => {
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

	async updateTsConfigToStrict(filePath?: string) {
		return updateTsConfigToStrict(filePath);
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

	async bootstrapViteConfig(filePath: string, importPath: string) {
		const code = await this.readFile(filePath);
		const result = transformViteConfig({ code, envImportPath: importPath });

		if (result.success && result.updated && result.code) {
			await this.writeFile(filePath, result.code);
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
		filePath: string,
		schemaPath: string,
		framework: "vite" | "bun",
	) {
		const { safeAppend } = await import("../injection");
		return safeAppend(filePath, schemaPath, framework);
	}
}
