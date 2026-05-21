import { type StdioOptions, spawn } from "node:child_process";
import fsp from "node:fs/promises";
import pc from "picocolors";
import type { BootstrapResult, WorkspacePort } from "@/shared/ports";
import {
	bootstrapBunConfig,
	bootstrapViteConfig,
	findBunConfig,
	findViteConfig,
} from "./utils/bootstrappers";
import { updateTsConfigToStrict } from "./utils/tsconfig";

/**
 * Adapter implementation for WorkspacePort using Node.js APIs.
 */
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

	async execute(
		command: string,
		args: string[] = [],
		cwd?: string,
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const child = spawn(command, args, {
				stdio: (this.isQuiet ? "pipe" : this.stdio) as StdioOptions,
				shell: false,
				cwd,
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
		return updateTsConfigToStrict(this, filePath);
	}

	async findViteConfig(cwd?: string): Promise<string | null> {
		return findViteConfig(cwd);
	}

	async findBunConfig(cwd?: string): Promise<string | null> {
		return findBunConfig(cwd);
	}

	async bootstrapViteConfig(
		filePath: string,
		importPath: string,
	): Promise<BootstrapResult> {
		return bootstrapViteConfig(this, filePath, importPath);
	}

	async bootstrapBunConfig(
		configPath?: string | null,
		features?: ("serve" | "build")[],
	): Promise<BootstrapResult> {
		return bootstrapBunConfig(configPath, features);
	}

	async safeAppend(
		filePath: string,
		schemaPath: string,
		framework: "vite" | "bun-fullstack",
	) {
		const { safeAppend } = await import("../injection");
		return safeAppend(filePath, schemaPath, framework);
	}
}
