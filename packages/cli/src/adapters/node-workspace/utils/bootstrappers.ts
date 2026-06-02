import fsp from "node:fs/promises";
import path from "node:path";
import dedent from "dedent";
import pc from "picocolors";
import { code } from "@/cli/ui/visuals";
import {
	transformNextjsConfig,
	transformViteConfig,
} from "@/features/config-mutation";
import type { BootstrapResult } from "@/shared/ports";

export async function findViteConfig(
	cwd = process.cwd(),
): Promise<string | null> {
	const filenames = [
		"vite.config.ts",
		"vite.config.js",
		"vite.config.mts",
		"vite.config.mjs",
	];
	for (const file of filenames) {
		const fullPath = path.resolve(cwd, file);
		try {
			await fsp.access(fullPath);
			return fullPath;
		} catch {
			// ignore missing file
		}
	}
	return null;
}

export async function findBunConfig(
	cwd = process.cwd(),
): Promise<string | null> {
	const filenames = ["bunfig.toml", "bun.setup.ts", "bun.setup.js"];
	for (const file of filenames) {
		const fullPath = path.resolve(cwd, file);
		try {
			await fsp.access(fullPath);
			return fullPath;
		} catch {
			// ignore missing file
		}
	}
	return null;
}

/**
 * Search for a Next.js configuration file in the given directory.
 *
 * @param cwd The directory to search in (defaults to `process.cwd()`)
 * @returns The full path to the found config file, or `null` if none exists
 */
export async function findNextjsConfig(
	cwd = process.cwd(),
): Promise<string | null> {
	const filenames = [
		"next.config.ts",
		"next.config.js",
		"next.config.mts",
		"next.config.mjs",
	];
	for (const file of filenames) {
		const fullPath = path.resolve(cwd, file);
		try {
			await fsp.access(fullPath);
			return fullPath;
		} catch {
			// ignore missing file
		}
	}
	return null;
}

/**
 * Bootstrap a Next.js config file by wrapping its default export with `withArkEnv`.
 *
 * @param workspace An object providing `readFile` and `writeFile` for the target file
 * @param filePath The path to the Next.js config file
 * @returns The result of the bootstrap operation
 */
export async function bootstrapNextjsConfig(
	workspace: {
		readFile(path: string): Promise<string>;
		writeFile(path: string, content: string): Promise<void>;
	},
	filePath: string,
): Promise<BootstrapResult> {
	try {
		const configCode = await workspace.readFile(filePath);
		const result = transformNextjsConfig({
			code: configCode,
		});

		if (result.success && result.updated && result.code) {
			await workspace.writeFile(filePath, result.code);
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

export async function bootstrapViteConfig(
	workspace: {
		readFile(path: string): Promise<string>;
		writeFile(path: string, content: string): Promise<void>;
	},
	filePath: string,
	importPath: string,
): Promise<BootstrapResult> {
	try {
		const configCode = await workspace.readFile(filePath);
		const result = transformViteConfig({
			code: configCode,
			envImportPath: importPath,
		});

		if (result.success && result.updated && result.code) {
			await workspace.writeFile(filePath, result.code);
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

export async function bootstrapBunConfig(
	_configPath?: string | null,
	features?: ("serve" | "build")[],
): Promise<BootstrapResult> {
	if (!features || features.length === 0) {
		return {
			success: true,
			instructions: dedent`
				${pc.green("✔")} Use ${pc.bold("Vanilla")} Bun runtime integration.
				Access validated variables via your ${code("env")} object for typesafety.
				Primarily used for ${pc.cyan("server-side")} or runtime-only validation.
				No plugins are required.
			`,
		};
	}

	const hasServe = features.includes("serve");
	const hasBuild = features.includes("build");

	let instructions = "";

	if (hasServe) {
		instructions += dedent`
			${pc.bold("Bun Fullstack (Bun.serve) Integration:")}
			To inline environment variables (e.g. ${code("PUBLIC_*")}) in your ${pc.cyan("client-side")} code, add the plugin to ${code("bunfig.toml")}:

			[serve.static]
			plugins = ["@arkenv/bun-plugin"]

		`;
	}

	if (hasBuild) {
		if (instructions) instructions += "\n";
		instructions += dedent`
			${pc.bold("Bun Fullstack programmatic bundling (Bun.build):")}
			To inline environment variables (e.g. ${code("PUBLIC_*")}) in your custom ${pc.cyan("client-side")} build script, add the plugin to your ${code("Bun.build")} call:

			${code('import arkenv from "@arkenv/bun-plugin";')}

			await Bun.build({
			  entrypoints: ["./index.ts"],
			  outdir: "./dist",
			  ${pc.green("plugins: [arkenv]")}
			});
		`;
	}

	return { success: true, instructions: instructions.trim() };
}
