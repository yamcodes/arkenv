import { exec as execCallback } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { ProjectOptions } from "./prompts";
import { getEnvTemplate } from "./templates";

const exec = promisify(execCallback);

export async function scaffold(
	options: ProjectOptions & { shouldUpdateTsConfig?: boolean },
) {
	const targetPath = path.resolve(process.cwd(), options.path);
	const targetDir = path.dirname(targetPath);

	// 1. Create directory if it doesn't exist
	await fs.mkdir(targetDir, { recursive: true });

	// 2. Generate and write env.ts
	const content = getEnvTemplate(options);
	await fs.writeFile(targetPath, content, "utf-8");

	// 3. Enforce strict in tsconfig.json if requested
	let tsConfigResult: "updated" | "already_strict" | "not_found" | "error" =
		"already_strict";
	if (options.shouldUpdateTsConfig) {
		tsConfigResult = await updateTsConfigToStrict();
	}

	// 4. Detect package manager and install dependencies
	const packageManager = await detectPackageManager();
	const deps = ["arkenv", options.validator];

	if (options.framework === "vite") deps.push("@arkenv/vite-plugin");
	if (options.framework === "bun") deps.push("@arkenv/bun-plugin");

	const installCmd = getInstallCommand(packageManager, deps);

	try {
		await exec(installCmd);
	} catch (error) {
		// If install fails, we don't want to crash the whole thing, but maybe log it?
		// For now, we'll just let the user know they might need to run it manually.
		throw new Error(`Failed to install dependencies: ${installCmd}`);
	}

	return { tsConfigResult };
}

export async function checkTsConfig(): Promise<
	"strict" | "not_strict" | "not_found"
> {
	const tsConfigPath = path.join(process.cwd(), "tsconfig.json");
	try {
		const content = await fs.readFile(tsConfigPath, "utf-8");
		if (/"strict"\s*:\s*true/.test(content)) return "strict";
		return "not_strict";
	} catch (e: any) {
		if (e.code === "ENOENT") return "not_found";
		throw e;
	}
}

async function updateTsConfigToStrict(): Promise<
	"updated" | "already_strict" | "not_found" | "error"
> {
	const tsConfigPath = path.join(process.cwd(), "tsconfig.json");
	try {
		const content = await fs.readFile(tsConfigPath, "utf-8");

		// Check if strict is already true
		if (/"strict"\s*:\s*true/.test(content)) {
			return "already_strict";
		}

		// If strict is false, replace it
		if (/"strict"\s*:\s*false/.test(content)) {
			const updated = content.replace(/"strict"\s*:\s*false/, '"strict": true');
			await fs.writeFile(tsConfigPath, updated, "utf-8");
			return "updated";
		}

		// If strict doesn't exist, try to add it to compilerOptions
		if (/"compilerOptions"\s*:\s*\{/.test(content)) {
			const updated = content.replace(
				/("compilerOptions"\s*:\s*\{)/,
				'$1\n    "strict": true,',
			);
			await fs.writeFile(tsConfigPath, updated, "utf-8");
			return "updated";
		}

		// If no compilerOptions, add it
		if (/\{/.test(content)) {
			const updated = content.replace(
				/\{/,
				'{\n  "compilerOptions": {\n    "strict": true\n  },',
			);
			await fs.writeFile(tsConfigPath, updated, "utf-8");
			return "updated";
		}

		return "error";
	} catch (e: any) {
		if (e.code === "ENOENT") return "not_found";
		return "error";
	}
}

async function detectPackageManager(): Promise<
	"pnpm" | "yarn" | "npm" | "bun"
> {
	let currentDir = process.cwd();

	while (currentDir !== path.parse(currentDir).root) {
		try {
			const pkgJsonPath = path.join(currentDir, "package.json");
			const pkgJsonContent = await fs.readFile(pkgJsonPath, "utf-8");
			const pkgJson = JSON.parse(pkgJsonContent);

			if (pkgJson.packageManager) {
				if (pkgJson.packageManager.startsWith("pnpm")) return "pnpm";
				if (pkgJson.packageManager.startsWith("yarn")) return "yarn";
				if (pkgJson.packageManager.startsWith("bun")) return "bun";
			}
		} catch {}

		const files = await fs.readdir(currentDir);
		if (files.includes("pnpm-lock.yaml")) return "pnpm";
		if (files.includes("yarn.lock")) return "yarn";
		if (files.includes("bun.lockb")) return "bun";
		if (files.includes("package-lock.json")) return "npm";

		currentDir = path.dirname(currentDir);
	}

	return "npm";
}

function getInstallCommand(pm: string, deps: string[]): string {
	switch (pm) {
		case "pnpm":
			return `pnpm add ${deps.join(" ")}`;
		case "yarn":
			return `yarn add ${deps.join(" ")}`;
		case "bun":
			return `bun add ${deps.join(" ")}`;
		default:
			return `npm install ${deps.join(" ")}`;
	}
}
