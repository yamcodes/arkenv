import fsp from "node:fs/promises";
import path from "node:path";
import { applyEdits, modify } from "jsonc-parser";

/**
 * Supported build/runtime frameworks.
 */
export type Framework = "vite" | "bun-fullstack" | "vanilla";

/**
 * Options for configuring a Workspace.
 */
export type WorkspaceOptions = {
	cwd?: string;
};

/**
 * Utility class for interacting with the local workspace.
 */
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

			if (await this.hasBunFeatures()) return "bun-fullstack";
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

		// Check for bun features
		if (await this.hasBunFeatures()) {
			return "bun-fullstack";
		}

		return "vanilla";
	}

	private async hasBunFeatures(): Promise<boolean> {
		if (await this.exists("bunfig.toml")) {
			const content = await this.readFile("bunfig.toml");
			if (
				content.includes("[serve]") ||
				content.includes("[serve.static]") ||
				content.includes("[build]")
			) {
				return true;
			}
		}

		// Common entry points
		const entryPoints = ["src/index.ts", "src/main.ts", "index.ts", "main.ts"];
		for (const entry of entryPoints) {
			if (await this.exists(entry)) {
				const content = await this.readFile(entry);
				if (
					content.includes("Bun.serve") ||
					content.includes("Bun.build") ||
					/from\s+['"]bun['"]/.test(content)
				) {
					return true;
				}
			}
		}

		return false;
	}

	async setTsConfigProperty(propertyPath: string[], value: unknown) {
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
