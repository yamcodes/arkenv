import { spawn } from "node:child_process";
import fsp from "node:fs/promises";
import pc from "picocolors";
import {
	bootstrapBunConfig,
	bootstrapViteConfig,
	findBunConfig,
	findViteConfig,
} from "./config-mutation";
import type { Workspace } from "../plan";
import { updateTsConfigToStrict } from "../scaffold";

export class NodeWorkspace implements Workspace {
	constructor(private isQuiet: boolean, private stdio: any) {}

	async writeFile(path: string, content: string): Promise<void> {
		await fsp.writeFile(path, content, "utf-8");
	}

	async mkdir(path: string, recursive?: boolean): Promise<void> {
		await fsp.mkdir(path, { recursive });
	}

	async execute(command: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const child = spawn(command, [], {
				stdio: this.isQuiet ? "pipe" : this.stdio,
				shell: true,
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

	async updateTsConfigToStrict() {
		return updateTsConfigToStrict();
	}

	async findViteConfig() {
		return findViteConfig();
	}

	async findBunConfig() {
		return findBunConfig();
	}

	async bootstrapViteConfig(path: string, importPath: string) {
		return bootstrapViteConfig(path, importPath);
	}

	async bootstrapBunConfig(path: string) {
		return bootstrapBunConfig(path);
	}

	async safeAppend(path: string, schemaPath: string, framework: "vite" | "bun") {
		const { safeAppend } = await import("../utils/injection");
		return safeAppend(path, schemaPath, framework);
	}
}
