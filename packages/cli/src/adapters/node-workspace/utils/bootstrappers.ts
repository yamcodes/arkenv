import fsp from "node:fs/promises";
import path from "node:path";
import dedent from "dedent";
import pc from "picocolors";
import { code } from "@/cli/ui/visuals";
import { transformViteConfig } from "@/features/config-mutation";
import type { BootstrapResult } from "@/shared/ports";

export async function findViteConfig(): Promise<string | null> {
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

export async function findBunConfig(): Promise<string | null> {
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
				${pc.green("✔")} Use Vanilla Bun runtime integration.
				Access validated variables via your ${code("env")} object for type safety.
				No build-time plugins are required for runtime-only usage.
			`,
		};
	}

	const hasServe = features.includes("serve");
	const hasBuild = features.includes("build");

	let instructions = "";

	if (hasServe) {
		instructions += dedent`
			${pc.bold("Fullstack dev server (Bun.serve) Integration:")}
			To inline environment variables (e.g. ${code("PUBLIC_*")}) in your frontend code, add the plugin to ${code("bunfig.toml")}:

			[serve.static]
			plugins = ["@arkenv/bun-plugin"]

		`;
	}

	if (hasBuild) {
		if (instructions) instructions += "\n";
		instructions += dedent`
			${pc.bold("Programmatic Bundler (Bun.build) Integration:")}
			To inline environment variables (e.g. ${code("PUBLIC_*")}) in your custom build script, add the plugin to your ${code("Bun.build")} call:

			${code('import arkenv from "@arkenv/bun-plugin";')}

			await Bun.build({
			  entrypoints: ["./index.ts"],
			  outdir: "./dist",
			  ${pc.green('plugins: [arkenv]')}
			});
		`;
	}

	return { success: true, instructions: instructions.trim() };
}
