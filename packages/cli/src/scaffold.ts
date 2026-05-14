import fsp from "node:fs/promises";
import path from "node:path";
import { cancel, confirm, isCancel } from "@clack/prompts";
import { parse } from "jsonc-parser";
import { getEnvTemplate } from "./env-template";
import { Workspace } from "./lib/workspace";
import type { ProjectOptions } from "./prompts";
import { bunTypesTemplate, viteTypesTemplate } from "./templates";

export async function scaffold(
	options: ProjectOptions & { shouldUpdateTsConfig?: boolean },
) {
	const workspace = new Workspace();
	const targetPath = path.resolve(process.cwd(), options.path);
	const targetDir = path.dirname(targetPath);

	// 1. Create directory if it doesn't exist
	await fsp.mkdir(targetDir, { recursive: true });

	// 4. Detect package manager and prepare installation info
	const packageManager = await detectPackageManager();
	const deps = ["arkenv", options.validator];

	if (options.framework === "vite") deps.push("@arkenv/vite-plugin");
	if (options.framework === "bun") deps.push("@arkenv/bun-plugin");

	const installCmd = getInstallCommand(packageManager, deps);

	// 2. Generate and write env.ts
	const content = getEnvTemplate(options);
	if (await workspace.exists(options.path)) {
		if (options.overwriteEnvSchemaFile === false) {
			return {
				tsConfigResult: { status: "already_strict" } as const,
				packageManager,
				installCmd: undefined,
				typeDefinitionResult: { status: "none" } as const,
			};
		}
		if (options.overwriteEnvSchemaFile === undefined) {
			const confirmOverwrite = await confirm({
				message: `File ${path.basename(targetPath)} already exists. Overwrite?`,
				initialValue: false,
			});

			if (isCancel(confirmOverwrite)) {
				cancel("Operation cancelled.");
				process.exit(0);
			}

			if (!confirmOverwrite) {
				return {
					tsConfigResult: { status: "already_strict" } as const,
					packageManager,
					installCmd: undefined,
					typeDefinitionResult: { status: "none" } as const,
				};
			}
		}
		await workspace.writeFile(options.path, content);
	} else {
		await workspace.writeFile(options.path, content);
	}

	// 3. Enforce strict in tsconfig if requested
	let tsConfigResult: {
		status: "updated" | "already_strict" | "not_found" | "error";
		file?: string;
	} = { status: "already_strict" };

	if (options.shouldUpdateTsConfig) {
		const result = await workspace.setTsConfigProperty(
			["compilerOptions", "strict"],
			true,
		);
		tsConfigResult = result as any;
	}

	// 5. Establish type definitions for Vite/Bun
	let typeDefinitionResult: {
		status: "created" | "overwritten" | "appended" | "skipped" | "none";
		file?: string;
	} = { status: "none" };

	if (
		(options.framework === "vite" || options.framework === "bun") &&
		options.installTypeDefinitions !== false
	) {
		typeDefinitionResult = await establishTypeDefinitions(
			workspace,
			options,
			targetDir,
		);
	}

	return { tsConfigResult, installCmd, packageManager, typeDefinitionResult };
}

async function establishTypeDefinitions(
	workspace: Workspace,
	options: ProjectOptions,
	targetDir: string,
): Promise<{
	status: "created" | "overwritten" | "appended" | "skipped";
	file: string;
}> {
	const typeFileName =
		options.framework === "vite" ? "vite-env.d.ts" : "bun-env.d.ts";
	const typeFilePath = path.join(targetDir, typeFileName);
	const schemaPath = path.resolve(process.cwd(), options.path);

	if (options.envDtsHandling === "skip") {
		return { status: "skipped", file: typeFileName };
	}

	if (
		options.envDtsHandling === "append" ||
		(!options.envDtsHandling && (await workspace.exists(typeFilePath)))
	) {
		const { safeAppend } = await import("./utils/injection");
		const result = await safeAppend(
			typeFilePath,
			schemaPath,
			options.framework as "vite" | "bun",
		);
		return { status: result ? "appended" : "skipped", file: typeFileName };
	}

	const template =
		options.framework === "vite" ? viteTypesTemplate : bunTypesTemplate;

	const isOverwrite = await workspace.exists(typeFilePath);
	await workspace.writeTemplate(typeFilePath, template, options.path);

	return {
		status: isOverwrite ? "overwritten" : "created",
		file: typeFileName,
	};
}

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

export async function detectFramework() {
	return new Workspace().detectFramework();
}

export async function checkTsConfig(): Promise<{
	status: "strict" | "not_strict" | "not_found";
	file?: string;
}> {
	const workspace = new Workspace();
	const tsConfigPath = await workspace.findTsConfig();
	if (!tsConfigPath) return { status: "not_found" };
	const fileName = path.basename(tsConfigPath);

	try {
		const content = await workspace.readFile(tsConfigPath);
		const parsed = parse(content);
		if (parsed?.compilerOptions?.strict === true) {
			return { status: "strict", file: fileName };
		}
		return { status: "not_strict", file: fileName };
	} catch {
		return { status: "not_found" };
	}
}

async function detectPackageManager(): Promise<
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
