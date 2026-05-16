import { type StdioOptions, spawn } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import dedent from "dedent";
import { applyEdits, modify, parse } from "jsonc-parser";
import pc from "picocolors";
import { code } from "@/cli/ui/visuals";
import { transformViteConfig } from "@/features/config-mutation";
import type { BootstrapResult, WorkspacePort } from "@/shared/ports";
import { NodeProjectScannerAdapter } from "../node-project-scanner";

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
		const scanner = new NodeProjectScannerAdapter();
		const tsConfigPath = filePath || (await scanner.findTsConfig());
		if (!tsConfigPath) return { status: "not_found" as const };
		const fileName = path.basename(tsConfigPath);

		try {
			const content = await this.readFile(tsConfigPath);
			const parsed = parse(content);

			if (parsed?.compilerOptions?.strict === true) {
				return { status: "already_strict" as const, file: fileName };
			}

			const edits = modify(content, ["compilerOptions", "strict"], true, {
				formattingOptions: { insertSpaces: true, tabSize: 2 },
			});
			const updated = applyEdits(content, edits);

			await this.writeFile(tsConfigPath, updated);
			return { status: "updated" as const, file: fileName };
		} catch {
			return { status: "error" as const, file: fileName };
		}
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

	async bootstrapViteConfig(
		filePath: string,
		importPath: string,
	): Promise<BootstrapResult> {
		try {
			const code = await this.readFile(filePath);
			const result = transformViteConfig({ code, envImportPath: importPath });

			if (result.success && result.updated && result.code) {
				await this.writeFile(filePath, result.code);
			}

			if (result.success) {
				return result.updated !== undefined
					? { success: true, updated: result.updated }
					: { success: true };
			}
			return {
				success: false,
				error: result.error!,
			};
		} catch (e: unknown) {
			return {
				success: false,
				error: e instanceof Error ? e.message : String(e),
			};
		}
	}

	async bootstrapBunConfig(
		configPath?: string | null,
	): Promise<BootstrapResult> {
		if (configPath?.endsWith("bunfig.toml")) {
			return {
				success: true,
				instructions: dedent`
					To complete Bun integration, ensure your ${code("bunfig.toml")} includes a preload file:

					[preload]
					preload = ["./bun.setup.ts"]

					Then, in your setup file, import the ArkEnv plugin.
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
					To complete Bun integration, add the ArkEnv plugin to your setup file:

					import arkenv from "@arkenv/bun-plugin";

					// If using Bun.build or similar:
					// plugins: [arkenv]
				`,
			};
		}

		const instructions = dedent`
			To complete Bun integration, we recommend creating a ${code("bun.setup.ts")} file and adding it to your ${code("bunfig.toml")}:

			${pc.dim("[preload]")}
			${pc.dim('preload = ["./bun.setup.ts"]')}

			In your setup file, import the ArkEnv plugin:

			${code('import arkenv from "@arkenv/bun-plugin";')}
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
