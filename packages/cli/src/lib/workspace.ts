import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { applyEdits, modify } from "jsonc-parser";
import { detectCodeFormat, generateCode, loadFile } from "magicast";

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
		return existsSync(this.resolve(filePath));
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
			const pkgJsonPath = this.resolve("package.json");
			const content = await fsp.readFile(pkgJsonPath, "utf-8");
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
			const content = await fsp.readFile(tsConfigPath, "utf-8");
			const edits = modify(content, propertyPath, value, {
				formattingOptions: { insertSpaces: true, tabSize: 2 },
			});
			const updated = applyEdits(content, edits);

			await fsp.writeFile(tsConfigPath, updated, "utf-8");
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

		while (currentDir !== path.parse(currentDir).root) {
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
		}
		return null;
	}

	async ensureVitePlugin(
		pluginName: string,
		options: {
			importFrom: string;
			imported?: string;
			envImportPath?: string | undefined;
			verify?: (code: string) => boolean;
		},
	): Promise<{ success: boolean; updated?: boolean; error?: string }> {
		const configPath = await this.findViteConfig();
		if (!configPath) return { success: false, error: "Vite config not found" };

		try {
			const mod = await loadFile(configPath);
			const initialCode = generateCode(mod).code;

			// 1. Find the plugins array
			let config = mod.exports.default;

			// Handle defineConfig({...}) wrapper
			if (
				config &&
				typeof config === "object" &&
				"$type" in config &&
				config.$type === "function-call"
			) {
				const callee =
					config.$callee || (config as any).$name || JSON.stringify(config);
				if (callee === "defineConfig") {
					config = config.$args[0];
				}
			}

			if (!config || typeof config !== "object") {
				return {
					success: false,
					updated: false,
					error: "Could not find default export in Vite config",
				};
			}

			if (!config.plugins) {
				config.plugins = [];
			}

			if (Array.isArray(config.plugins)) {
				const hasPlugin = options.verify
					? options.verify(initialCode)
					: initialCode.includes(pluginName);

				if (!hasPlugin) {
					// Add imports
					mod.imports.$add({
						from: options.importFrom,
						local: pluginName,
						imported: options.imported || "default",
					});

					if (options.envImportPath) {
						mod.imports.$add({
							from: options.envImportPath,
							imported: "Env",
						});
					}

					config.plugins.push("__ARK_PLUGIN_PLACEHOLDER__");
				} else {
					return { success: true, updated: false };
				}
			} else {
				return {
					success: false,
					updated: false,
					error: `The 'plugins' property in ${path.basename(configPath)} is not an array.`,
				};
			}

			let code = generateCode(mod, {
				format: detectCodeFormat(initialCode),
			}).code;
			const pluginCall = options.envImportPath
				? `${pluginName}(Env)`
				: `${pluginName}()`;
			code = code.replace(/['"]__ARK_PLUGIN_PLACEHOLDER__['"]/g, pluginCall);

			await fsp.writeFile(configPath, code, "utf-8");
			return { success: true, updated: true };
		} catch (e: unknown) {
			const error = e instanceof Error ? e.message : String(e);
			return {
				success: false,
				updated: false,
				error: `Failed to parse ${path.basename(configPath)}: ${error}`,
			};
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
			const fullPath = this.resolve(file);
			if (existsSync(fullPath)) return fullPath;
		}
		return null;
	}

	async writeTemplate(
		targetPath: string,
		template: (data?: any) => string,
		data?: any,
	) {
		const content = template(data);
		await this.writeFile(targetPath, content);
	}
}
