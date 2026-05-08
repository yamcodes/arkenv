import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { ProjectOptions } from "./prompts";
import { getEnvTemplate } from "./templates";

export async function scaffold(options: ProjectOptions) {
	const targetPath = path.resolve(process.cwd(), options.path);
	const targetDir = path.dirname(targetPath);

	// 1. Create directory if it doesn't exist
	await fs.mkdir(targetDir, { recursive: true });

	// 2. Generate and write env.ts
	const content = getEnvTemplate(options);
	await fs.writeFile(targetPath, content, "utf-8");

	// 3. Detect package manager and install dependencies
	const packageManager = await detectPackageManager();
	const deps = ["arkenv", options.validator];

	if (options.framework === "vite") deps.push("@arkenv/vite-plugin");
	if (options.framework === "bun") deps.push("@arkenv/bun-plugin");

	const installCmd = getInstallCommand(packageManager, deps);

	try {
		execSync(installCmd, { stdio: "ignore" });
	} catch (error) {
		// If install fails, we don't want to crash the whole thing, but maybe log it?
		// For now, we'll just let the user know they might need to run it manually.
		throw new Error(`Failed to install dependencies: ${installCmd}`);
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
