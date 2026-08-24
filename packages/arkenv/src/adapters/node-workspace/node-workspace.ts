import { type StdioOptions, spawn } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import pc from "picocolors";
import type {
	BootstrapResult,
	LoggerPort,
	WorkspacePort,
} from "@/shared/ports";
import {
	bootstrapBunConfig,
	bootstrapNextjsConfig,
	bootstrapNuxtConfig,
	bootstrapViteConfig,
	findBunConfig,
	findNextjsConfig,
	findNuxtConfig,
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
		private logger?: Pick<LoggerPort, "error">,
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
				cwd,
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
		return updateTsConfigToStrict(this, filePath);
	}

	async findViteConfig(cwd?: string): Promise<string | null> {
		return findViteConfig(cwd);
	}

	async findBunConfig(cwd?: string): Promise<string | null> {
		return findBunConfig(cwd);
	}

	async findNextjsConfig(cwd?: string): Promise<string | null> {
		return findNextjsConfig(cwd);
	}

	async findNuxtConfig(cwd?: string): Promise<string | null> {
		return findNuxtConfig(cwd);
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

	async bootstrapNextjsConfig(
		filePath: string,
		disableCodegen?: boolean,
	): Promise<BootstrapResult> {
		return bootstrapNextjsConfig(this, filePath, disableCodegen);
	}

	async bootstrapNuxtConfig(filePath: string): Promise<BootstrapResult> {
		return bootstrapNuxtConfig(this, filePath);
	}

	async safeAppend(
		filePath: string,
		schemaPath: string,
		framework: "vite" | "bun-fullstack",
	) {
		const { safeAppend } = await import("../injection");
		return safeAppend(filePath, schemaPath, framework, this.logger);
	}

	async appendMissingEnvExampleKeys(
		cwd: string,
		keys: string[],
	): Promise<boolean> {
		const envExamplePath = path.join(cwd, ".env.example");
		if (!(await this.exists(envExamplePath))) {
			return false;
		}
		const content = await this.readFile(envExamplePath);
		const existingKeys = new Set<string>();
		for (const line of content.split(/\r?\n/)) {
			const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
			if (m) {
				existingKeys.add(m[1]);
			}
		}
		const missingKeys = keys.filter((k) => !existingKeys.has(k));
		if (missingKeys.length === 0) {
			return false;
		}
		const appendLines = missingKeys.map((k) => `${k}=`).join("\n") + "\n";
		const newContent =
			content.endsWith("\n") || content.length === 0
				? `${content}${appendLines}`
				: `${content}\n${appendLines}`;
		await this.writeFile(envExamplePath, newContent);
		return true;
	}

	async removeEnvExampleKeys(
		cwd: string,
		keysToRemove: string[],
		remainingKeys: string[] = [],
	): Promise<boolean> {
		const envExamplePath = path.join(cwd, ".env.example");
		if (!(await this.exists(envExamplePath))) {
			return false;
		}
		const safeKeysToRemove = new Set(
			keysToRemove.filter((k) => !remainingKeys.includes(k)),
		);
		if (safeKeysToRemove.size === 0) {
			return false;
		}
		const content = await this.readFile(envExamplePath);
		const lines = content.split(/\r?\n/);
		const newLines = lines.filter((line) => {
			const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
			if (m && safeKeysToRemove.has(m[1])) {
				return false;
			}
			return true;
		});
		let newContent = newLines.join("\n");
		if (content.endsWith("\n") && !newContent.endsWith("\n")) {
			newContent += "\n";
		}
		if (newContent !== content) {
			await this.writeFile(envExamplePath, newContent);
			return true;
		}
		return false;
	}
}
