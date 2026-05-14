import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { applyEdits, modify, parse } from "jsonc-parser";

export function getDlxCommand(pm: string): string {
	switch (pm) {
		case "pnpm":
			return "pnpm dlx";
		case "yarn":
			return "yarn dlx";
		case "bun":
			return "bunx";
		default:
			return "npx";
	}
}

async function findTsConfig(): Promise<string | null> {
	const filenames = [
		"tsconfig.app.json",
		"tsconfig.json",
		"tsconfig.base.json",
		"tsconfig.node.json",
	];
	let currentDir = process.cwd();

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

export async function checkTsConfig(): Promise<{
	status: "strict" | "not_strict" | "not_found";
	file?: string;
}> {
	const tsConfigPath = await findTsConfig();
	if (!tsConfigPath) return { status: "not_found" };
	const fileName = path.basename(tsConfigPath);

	try {
		const content = await fsp.readFile(tsConfigPath, "utf-8");
		const parsed = parse(content);
		if (parsed?.compilerOptions?.strict === true) {
			return { status: "strict", file: fileName };
		}
		return { status: "not_strict", file: fileName };
	} catch {
		return { status: "not_found" };
	}
}

export async function updateTsConfigToStrict(): Promise<{
	status: "updated" | "already_strict" | "not_found" | "error";
	file?: string;
}> {
	const tsConfigPath = await findTsConfig();
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

export async function detectFramework(): Promise<"vite" | "bun" | "node"> {
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

export async function detectPackageManager(): Promise<
	"pnpm" | "yarn" | "npm" | "bun"
> {
	const userAgent = process.env.npm_config_user_agent?.toString() || "";
	if (userAgent.includes("pnpm")) return "pnpm";
	if (userAgent.includes("yarn")) return "yarn";
	if (userAgent.includes("bun")) return "bun";
	if (userAgent.includes("npm")) return "npm";

	let currentDir = process.cwd();

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

		const files = await fsp.readdir(currentDir);
		if (files.includes("pnpm-lock.yaml")) return "pnpm";
		if (files.includes("yarn.lock")) return "yarn";
		if (files.includes("bun.lockb")) return "bun";
		if (files.includes("package-lock.json")) return "npm";

		currentDir = path.dirname(currentDir);
	}

	return "npm";
}
