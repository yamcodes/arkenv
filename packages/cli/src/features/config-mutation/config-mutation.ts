import {
	builders,
	detectCodeFormat,
	generateCode,
	parseModule,
} from "magicast";
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

/**
 * Transforms a Next.js configuration file by wrapping the default export with `withArkEnv`.
 *
 * @param input The configuration code and optional import path.
 * @returns The result of the bootstrap operation, potentially including the updated code.
 */
export function transformNextjsConfig(
	input: MutationInput,
): BootstrapResult & { code?: string } {
	try {
		const initialCode = input.code;

		// Check for CommonJS - can't auto-mutate
		if (/module\.exports\b/.test(initialCode)) {
			return {
				success: false,
				updated: false,
				error:
					"CommonJS is not supported for automatic mutation. Please wrap your config with `withArkEnv` manually.",
			};
		}

		const mod = parseModule(initialCode);

		// Verify there's a default export
		if (!mod.exports.default) {
			return {
				success: false,
				updated: false,
				error: "Could not find default export in Next.js config",
			};
		}

		// Check if already wrapped with withArkEnv using the AST
		if (
			typeof mod.exports.default === "object" &&
			"$type" in (mod.exports.default as object) &&
			(mod.exports.default as { $type?: string }).$type ===
				"function-call" &&
			(mod.exports.default as { $callee?: string }).$callee === "withArkEnv"
		) {
			return { success: true, updated: false };
		}

		// Also check via regex for cases where withArkEnv is used inline
		if (/\bwithArkEnv\b/.test(initialCode)) {
			return { success: true, updated: false };
		}

		// Add import
		mod.imports.$add({
			from: "@arkenv/nextjs/config",
			imported: "withArkEnv",
		});

		// Wrap the default export with withArkEnv(...) using the AST
		mod.exports.default = builders.functionCall(
			"withArkEnv",
			mod.exports.default,
		);

		const code = generateCode(mod, {
			format: detectCodeFormat(initialCode),
		}).code;

		return { success: true, updated: true, code };
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : String(e);
		return {
			success: false,
			updated: false,
			error: `Failed to parse Next.js config: ${error}`,
		};
	}
}
