import { detectCodeFormat, generateCode, parseModule } from "magicast";
import type { BootstrapResult } from "../scaffold/plan";

export type MutationInput = {
	code: string;
	envImportPath?: string;
};

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
			const call = config as { $callee?: string; $args?: unknown[] };
			const callee = call.$callee || JSON.stringify(config);
			if (callee === "defineConfig" && call.$args) {
				config = call.$args[0];
			}
		}

		if (!config || typeof config !== "object") {
			return {
				success: false,
				updated: false,
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
