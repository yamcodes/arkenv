import {
	builders,
	detectCodeFormat,
	generateCode,
	parseModule,
} from "magicast";
import { FRAMEWORK_CLIENT_PREFIXES } from "@/features/scaffold/frameworks";
import type { Framework, Validator } from "@/features/scaffold/plan";
import { getPresetKeys, type HostPreset } from "@/features/scaffold/presets";
import {
	DIALECTS,
	tryFormatPresetFieldValue,
} from "@/features/scaffold/validators/dialects";
import type { BootstrapResult } from "@/shared/ports";

/**
 * Input for transforming a configuration file.
 */
export type MutationInput = {
	code: string;
	envImportPath?: string;
	disableCodegen?: boolean | undefined;
};

/**
 * Normalizes named import spacing in generated code.
 * magicast produces `import {Foo}`; this ensures `import { Foo }`.
 */
function normalizeImportSpacing(code: string): string {
	return code.replace(
		/import\s*\{([^\n}]*)\}\s*from/g,
		(match, p1) => `import { ${p1.trim()} } from`,
	);
}

/**
 * Preserves the trailing newline of the original file if present.
 * magicast strips trailing newlines; this restores them.
 */
function preserveTrailingNewline(code: string, originalCode: string): string {
	return originalCode.endsWith("\n") && !code.endsWith("\n")
		? `${code}\n`
		: code;
}

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
		code = normalizeImportSpacing(code);
		code = preserveTrailingNewline(code, initialCode);

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
 * Transform a Next.js configuration file by wrapping the default export with `withArkEnv`.
 *
 * @param input The configuration code and optional import path
 * @returns The result of the bootstrap operation, potentially including the updated code
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
			(mod.exports.default as { $type?: string }).$type === "function-call" &&
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
		if (input.disableCodegen) {
			mod.exports.default = builders.functionCall(
				"withArkEnv",
				mod.exports.default,
				{ codegen: false },
			);
		} else {
			mod.exports.default = builders.functionCall(
				"withArkEnv",
				mod.exports.default,
			);
		}

		let code = generateCode(mod, {
			format: detectCodeFormat(initialCode),
		}).code;
		code = normalizeImportSpacing(code);
		code = preserveTrailingNewline(code, initialCode);

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

/**
 * Transform a Nuxt configuration file by adding `@arkenv/nuxt/module` to its modules.
 *
 * @param input The configuration code and optional import path
 * @returns The result of the bootstrap operation, potentially including the updated code
 */
export function transformNuxtConfig(
	input: MutationInput,
): BootstrapResult & { code?: string } {
	try {
		const initialCode = input.code;
		const mod = parseModule(initialCode);

		let config = mod.exports.default;

		// Handle defineNuxtConfig({...}) wrapper
		if (
			config &&
			typeof config === "object" &&
			"$type" in config &&
			config.$type === "function-call"
		) {
			const call = config as { $callee?: string; $args?: any[] };
			const callee = call.$callee || JSON.stringify(config);
			if (callee === "defineNuxtConfig" && call.$args) {
				config = call.$args[0];
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
				error: "Could not find default export object in Nuxt config",
			};
		}

		if (!config.modules) {
			config.modules = [];
		}

		if (Array.isArray(config.modules)) {
			const hasModule = config.modules.includes("@arkenv/nuxt/module");

			if (!hasModule) {
				config.modules.push("@arkenv/nuxt/module");
			} else {
				return { success: true, updated: false };
			}
		} else {
			return {
				success: false,
				updated: false,
				error: "The 'modules' property in your Nuxt config is not an array.",
			};
		}

		let code = generateCode(mod, {
			format: detectCodeFormat(initialCode),
		}).code;
		code = normalizeImportSpacing(code);
		code = preserveTrailingNewline(code, initialCode);

		return { success: true, updated: true, code };
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : String(e);
		return {
			success: false,
			updated: false,
			error: `Failed to parse Nuxt config: ${error}`,
		};
	}
}

/**
 * Resolve a hosting-preset key to a validator-specific schema fragment.
 *
 * Uses v1 dialect renderers (same as scaffold codegen) so add-host and
 * mutateEnvConfig output stay aligned with `arkenv init` field syntax.
 */
export function getFieldDefinition(
	key: string,
	validator: Validator,
	prefix: string,
	preset: HostPreset,
): string {
	const dialect = DIALECTS[validator];
	return (
		tryFormatPresetFieldValue(dialect, key, prefix, preset) ??
		dialect.formatOptionalString()
	);
}

/**
 * Transform an env.ts schema file by merging host preset keys.
 *
 * @param code The environment configuration code.
 * @param preset The selected hosting provider preset.
 * @param framework The active framework.
 * @param validator The active validator.
 * @param targetKeys Optional specific keys to mutate (defaults to all preset keys).
 * @returns The result of the mutation operation.
 */
export function mutateEnvConfig(
	code: string,
	preset: HostPreset,
	framework: Framework,
	validator: Validator,
	targetKeys?: string[],
): {
	success: boolean;
	updated: boolean;
	code?: string;
	error?: string;
	proposedFields: Record<string, string>;
} {
	const prefix = FRAMEWORK_CLIENT_PREFIXES[framework];
	const keysToMutate = targetKeys ?? getPresetKeys(preset, prefix);
	const proposedFields: Record<string, string> = {};

	for (const key of keysToMutate) {
		proposedFields[key] = getFieldDefinition(key, validator, prefix, preset);
	}

	try {
		const mod = parseModule(code);
		const envExport =
			mod.exports.env || mod.exports.Env || mod.exports.SharedSchema;
		if (
			!envExport ||
			envExport.$type !== "function-call" ||
			(envExport.$callee !== "arkenv" &&
				envExport.$callee !== "type" &&
				envExport.$callee !== "z.object" &&
				envExport.$callee !== "v.object")
		) {
			return {
				success: false,
				updated: false,
				error: "Could not find arkenv or type schema call in env.ts",
				proposedFields,
			};
		}

		const obj = envExport.$args[0];
		if (!obj || typeof obj !== "object" || "$type" in obj) {
			return {
				success: false,
				updated: false,
				error: "Could not find schema object literal inside arkenv/type call",
				proposedFields,
			};
		}

		let updated = false;
		const replacements: Record<string, string> = {};

		for (const key of keysToMutate) {
			// Only add if the key doesn't already exist in the schema
			if (!(key in obj)) {
				const placeholder = `__ARK_PRESET_PLACEHOLDER_${key}__`;
				obj[key] = placeholder;
				replacements[placeholder] = proposedFields[key];
				updated = true;
			}
		}

		if (!updated) {
			return { success: true, updated: false, code, proposedFields };
		}

		let generatedCode = generateCode(mod, {
			format: detectCodeFormat(code),
		}).code;

		// Replace placeholders
		for (const [placeholder, rawVal] of Object.entries(replacements)) {
			generatedCode = generatedCode.replace(
				new RegExp(`['"]${placeholder}['"]`, "g"),
				rawVal,
			);
		}

		generatedCode = normalizeImportSpacing(generatedCode);
		generatedCode = preserveTrailingNewline(generatedCode, code);

		return {
			success: true,
			updated: true,
			code: generatedCode,
			proposedFields,
		};
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : String(e);
		return {
			success: false,
			updated: false,
			error: `Failed to parse env.ts: ${error}`,
			proposedFields,
		};
	}
}
