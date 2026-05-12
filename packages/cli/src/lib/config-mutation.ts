import fsp from "node:fs/promises";
import path from "node:path";
import dedent from "dedent";
import { detectCodeFormat, generateCode, loadFile } from "magicast";
import pc from "picocolors";

export async function findViteConfig(): Promise<string | null> {
	const filenames = [
		"vite.config.ts",
		"vite.config.js",
		"vite.config.mts",
		"vite.config.mjs",
	];
	const currentDir = process.cwd();

	for (const file of filenames) {
		const fullPath = path.join(currentDir, file);
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
	const currentDir = process.cwd();

	for (const file of filenames) {
		const fullPath = path.join(currentDir, file);
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
	configPath: string,
	envImportPath?: string,
): Promise<{ success: boolean; error?: string }> {
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
				error: "Could not find default export in Vite config",
			};
		}

		if (!config.plugins) {
			config.plugins = [];
		}

		if (Array.isArray(config.plugins)) {
			// Check if already exists using the generated code
			const hasPlugin =
				initialCode.includes("arkenvVitePlugin") ||
				initialCode.includes("arkenvPlugin");

			if (!hasPlugin) {
				// Add imports
				mod.imports.$add({
					from: "@arkenv/vite-plugin",
					local: "arkenvVitePlugin",
					imported: "default",
				});

				if (envImportPath) {
					mod.imports.$add({
						from: envImportPath,
						imported: "Env",
					});
				}

				config.plugins.push("__ARK_PLUGIN_PLACEHOLDER__");
			} else {
				// Already has plugin, nothing to do
				return { success: true };
			}
		} else {
			return {
				success: false,
				error: `The 'plugins' property in ${path.basename(configPath)} is not an array.`,
			};
		}

		let code = generateCode(mod, { format: detectCodeFormat(initialCode) }).code;
		const pluginCall = envImportPath
			? "arkenvVitePlugin(Env)"
			: "arkenvVitePlugin()";
		code = code.replace(/['"]__ARK_PLUGIN_PLACEHOLDER__['"]/g, pluginCall);

		await fsp.writeFile(configPath, code, "utf-8");
		return { success: true };
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : String(e);
		return {
			success: false,
			error: `Failed to parse ${path.basename(configPath)}: ${error}`,
		};
	}
}

export async function bootstrapBunConfig(_configPath?: string | null): Promise<{
	success: boolean;
	error?: string;
	instructions?: string;
}> {
	try {
		// For Bun, we currently prioritize providing clear instructions
		// as there isn't a single standard config file like Vite.
		// If we find bunfig.toml, we can suggest adding it there.

		const instructions = dedent`
			To complete Bun integration, add the following to your setup/preload file:
			
			${pc.cyan('import arkenv from "@arkenv/bun-plugin";')}
			
			${pc.cyan("Bun.build({")}
			${pc.cyan("  // ... other config")}
			${pc.cyan("  plugins: [arkenv],")}
			${pc.cyan("});")}
			
			If you don't have a setup file, create one (e.g., ${pc.dim("bun.setup.ts")}) and add it to your ${pc.dim("bunfig.toml")}:
			
			${pc.green("[preload]")}
			${pc.green('preload = ["./bun.setup.ts"]')}
		`;

		return { success: true, instructions };
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : String(e);
		return { success: false, error };
	}
}
