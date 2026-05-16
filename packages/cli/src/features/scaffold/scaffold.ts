import fsp from "node:fs/promises";
import path from "node:path";
import { applyEdits, modify, parse } from "jsonc-parser";
import {
	findTsConfig,
	loadTsConfig,
	type ParsedTsConfig,
} from "./tsconfig-parser";

/**
 * Returns the appropriate 'dlx' or 'exec' command for the given package manager.
 *
 * @param pm The package manager name (e.g., "pnpm", "bun").
 * @returns The dlx command array.
 */
export function getDlxCommand(pm: string): string[] {
	switch (pm) {
		case "pnpm":
			return ["pnpm", "dlx"];
		case "yarn":
			return ["yarn", "dlx"];
		case "bun":
			return ["bunx"];
		default:
			return ["npx"];
	}
}

/**
 * Checks the workspace's tsconfig.json to see if strict mode is enabled.
 *
 * @returns The status of strict mode in the tsconfig.
 */
export async function checkTsConfig(): Promise<{
	status: "strict" | "not_strict" | "not_found";
	file?: string;
	parsed?: ParsedTsConfig;
}> {
	const tsConfigPath = await findTsConfig();
	if (!tsConfigPath) return { status: "not_found" };
	const fileName = path.basename(tsConfigPath);

	try {
		const parsed = await loadTsConfig(tsConfigPath);
		if (parsed?.compilerOptions?.strict === true) {
			return { status: "strict", file: fileName, parsed };
		}
		return { status: "not_strict", file: fileName, parsed };
	} catch {
		return { status: "not_found" };
	}
}

/**
 * Attempts to automatically update the tsconfig.json to enable strict mode.
 *
 * @param pathOverride Optional specific path to the tsconfig file.
 * @returns The result of the update operation.
 */
export async function updateTsConfigToStrict(pathOverride?: string): Promise<{
	status: "updated" | "already_strict" | "not_found" | "error";
	file?: string;
}> {
	const tsConfigPath = pathOverride || (await findTsConfig());
	if (!tsConfigPath) return { status: "not_found" };
	const fileName = path.basename(tsConfigPath);

	try {
		const content = await fsp.readFile(tsConfigPath, "utf-8");
		const parsed = parse(content);

		if (parsed?.compilerOptions?.strict === true) {
			return { status: "already_strict", file: fileName };
		}

		const edits = modify(content, ["compilerOptions", "strict"], true, {
			formattingOptions: { insertSpaces: true, tabSize: 2 },
		});
		const updated = applyEdits(content, edits);

		await fsp.writeFile(tsConfigPath, updated, "utf-8");
		return { status: "updated", file: fileName };
	} catch {
		return { status: "error", file: fileName };
	}
}

/**
 * Detects the primary framework used in the current workspace (Vite, Bun, or Node),
 * considering tsconfig types and configuration files.
 *
 * @returns The detected framework.
 */
export async function detectFramework(
	tsConfig?: ParsedTsConfig | null,
): Promise<"vite" | "bun" | "node"> {
	if (tsConfig?.compilerOptions?.types) {
		const types = tsConfig.compilerOptions.types;
		if (types.includes("vite") || types.includes("vite/client")) return "vite";
		if (types.includes("bun") || types.includes("@types/bun")) return "bun";
	}

	try {
		const pkgJsonPath = path.join(process.cwd(), "package.json");
		const content = await fsp.readFile(pkgJsonPath, "utf-8");
		const pkg = JSON.parse(content);
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

		if (allDeps.vite) return "vite";
		if (allDeps["@types/bun"] || allDeps.bun) return "bun";
	} catch {
		// ignore missing or invalid package.json
	}

	// Check for config files
	try {
		await fsp.access(path.join(process.cwd(), "vite.config.ts"));
		return "vite";
	} catch {
		// vite.config.ts not found
	}
	try {
		await fsp.access(path.join(process.cwd(), "vite.config.js"));
		return "vite";
	} catch {
		// vite.config.js not found
	}

	// Check for bun runtime
	if ("bun" in process.versions) return "bun";

	return "node";
}

/**
 * Detects the package manager used in the current workspace based on lockfiles,
 * user agent, or package.json configurations.
 *
 * @returns The detected package manager.
 */
export async function detectPackageManager(
	tsConfig?: ParsedTsConfig | null,
): Promise<"pnpm" | "yarn" | "npm" | "bun"> {
	const userAgent = process.env.npm_config_user_agent?.toString() || "";
	if (userAgent.includes("pnpm")) return "pnpm";
	if (userAgent.includes("yarn")) return "yarn";
	if (userAgent.includes("bun")) return "bun";
	if (userAgent.includes("npm")) return "npm";

	let currentDir = tsConfig?.path ? path.dirname(tsConfig.path) : process.cwd();

	while (currentDir !== path.parse(currentDir).root) {
		try {
			const pkgJsonPath = path.join(currentDir, "package.json");
			const pkgJsonContent = await fsp.readFile(pkgJsonPath, "utf-8");
			const pkgJson = JSON.parse(pkgJsonContent);

			if (pkgJson.packageManager) {
				if (pkgJson.packageManager.startsWith("pnpm")) return "pnpm";
				if (pkgJson.packageManager.startsWith("yarn")) return "yarn";
				if (pkgJson.packageManager.startsWith("bun")) return "bun";
			}
		} catch {
			// ignore missing or invalid package.json in parent directories
		}

		let files: string[] = [];
		try {
			files = await fsp.readdir(currentDir);
		} catch {
			// ignore inaccessible directories
		}

		if (files.includes("pnpm-lock.yaml")) return "pnpm";
		if (files.includes("yarn.lock")) return "yarn";
		if (files.includes("bun.lockb")) return "bun";
		if (files.includes("package-lock.json")) return "npm";

		currentDir = path.dirname(currentDir);
	}

	return "npm";
}

/**
 * Suggests the default path for env.ts based on tsconfig.json rootDir or existing project structure.
 */
export async function suggestDefaultEnvPath(
	cwd = process.cwd(),
	tsConfig?: ParsedTsConfig | null,
): Promise<string> {
	let currentTsConfig = tsConfig;
	if (!currentTsConfig) {
		const tsConfigPath = await findTsConfig(cwd);
		if (tsConfigPath) {
			currentTsConfig = await loadTsConfig(tsConfigPath);
		}
	}

	if (currentTsConfig?.compilerOptions?.rootDir) {
		const rootDir = currentTsConfig.compilerOptions.rootDir;
		const rel = path.relative(cwd, rootDir);
		if (!rel || rel === ".") return "./env.ts";
		return `./${rel}/env.ts`;
	}

	try {
		await fsp.access(path.join(cwd, "src"));
		return "./src/env.ts";
	} catch {
		return "./env.ts";
	}
}
