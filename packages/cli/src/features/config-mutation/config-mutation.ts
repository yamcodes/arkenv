import { detectCodeFormat, generateCode, parseModule } from "magicast";
import type { BootstrapResult } from "@/shared/ports";

/**
 * Input for transforming a configuration file.
 */
export type MutationInput = {
	code: string;
	envImportPath?: string;
};

/**
 * Transforms a Vite configuration file by injecting the ArkEnv Vite plugin.
 *
 * @param input The configuration code and optional import path.
 * @returns The result of the bootstrap operation, potentially including the updated code.
 */
export function transformViteConfig(
	input: MutationInput,
): BootstrapResult & { code?: string } {
	try {
		const mod = parseModule(input.code);
		const initialCode = input.code;

		// 1. Find the plugins array
		let config = mod.exports.default;

		// Handle defineConfig({...}) wrapper
		if (
			config &&
			typeof config === "object" &&
			"$type" in config &&
			config.$type === "function-call"
		) {
			const call = config as { $callee?: string; $args?: any[] };
			const callee = call.$callee || JSON.stringify(config);
			if (callee === "defineConfig" && call.$args) {
				const arg = call.$args[0];
				// Guard against defineConfig((env) => ({...})) callback form
				if (
					arg &&
					typeof arg === "object" &&
					"$type" in arg &&
					(arg.$type === "arrow-function-expression" ||
						arg.$type === "function-expression")
				) {
					return {
						success: false,
						updated: false,
						error:
							"The 'defineConfig' callback form is currently not supported for automatic mutation. Please add the plugin manually.",
					};
				}
				config = arg;
			}
		}

		if (
			!config ||
			typeof config !== "object" ||
			(typeof config === "object" && "$type" in config)
		) {
			return {
				success: false,
				updated: false,
				error: "Could not find default export object in Vite config",
			};
		}

		if (!config.plugins) {
			config.plugins = [];
		}

		if (Array.isArray(config.plugins)) {
			// Check if already exists using a word-boundary regex to avoid false positives
			const hasPlugin = /\barkenv(?:Vite)?Plugin\b/.test(initialCode);

			if (!hasPlugin) {
				// Add imports
				mod.imports.$add({
					from: "@arkenv/vite-plugin",
					local: "arkenvVitePlugin",
					imported: "default",
				});

				if (input.envImportPath) {
					mod.imports.$add({
						from: input.envImportPath,
						imported: "Env",
					});
				}

				config.plugins.push("__ARK_PLUGIN_PLACEHOLDER__");
			} else {
				// Already has plugin, nothing to do
				return { success: true, updated: false };
			}
		} else {
			return {
				success: false,
				updated: false,
				error: "The 'plugins' property in your Vite config is not an array.",
			};
		}

		let code = generateCode(mod, {
			format: detectCodeFormat(initialCode),
		}).code;
		const pluginCall = input.envImportPath
			? "arkenvVitePlugin(Env)"
			: "arkenvVitePlugin()";
		code = code.replace(/['"]__ARK_PLUGIN_PLACEHOLDER__['"]/g, pluginCall);

		return { success: true, updated: true, code };
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : String(e);
		return {
			success: false,
			updated: false,
			error: `Failed to parse Vite config: ${error}`,
		};
	}
}
