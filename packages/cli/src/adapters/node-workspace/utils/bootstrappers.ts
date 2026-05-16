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
