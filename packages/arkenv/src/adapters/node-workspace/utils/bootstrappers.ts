import fsp from "node:fs/promises";
import path from "node:path";
import dedent from "dedent";
import {
	builders,
	detectCodeFormat,
	generateCode,
	parseModule,
} from "magicast";
import pc from "picocolors";
import { code } from "@/cli/ui/visuals";
import type { BootstrapResult } from "@/shared/ports";

/**
 * Input for transforming a framework configuration file.
 */
export type MutationInput = {
	code: string;
	disableCodegen?: boolean | undefined;
};

/**
 * Normalizes named import spacing in generated code.
 * magicast produces `import {Foo}`; this ensures `import { Foo }`.
 */
function normalizeImportSpacing(code: string): string {
	return code.replace(
		/import\s*\{([^\n}]*)\}\s*from/g,
		(_match, p1) => `import { ${p1.trim()} } from`,
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
			if (callee === "defineConfig") {
				const rawArg = (call as { $ast?: { arguments?: { type: string }[] } })
					.$ast?.arguments?.[0];
				if (
					rawArg?.type === "ArrowFunctionExpression" ||
					rawArg?.type === "FunctionExpression"
				) {
					return {
						success: false,
						updated: false,
						error:
							"The 'defineConfig' callback form is currently not supported for automatic mutation. Please add the plugin manually.",
					};
				}
				const arg = call.$args?.[0];
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
		const pluginCall = "arkenvVitePlugin()";
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
 * Transforms an Rsbuild configuration file by injecting the ArkEnv Rsbuild plugin.
 *
 * @param input The configuration code.
 * @returns The result of the bootstrap operation, potentially including the updated code.
 */
export function transformRsbuildConfig(
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
			if (callee === "defineConfig") {
				const rawArg = (call as { $ast?: { arguments?: { type: string }[] } })
					.$ast?.arguments?.[0];
				if (
					rawArg?.type === "ArrowFunctionExpression" ||
					rawArg?.type === "FunctionExpression"
				) {
					return {
						success: false,
						updated: false,
						error:
							"The 'defineConfig' callback form is currently not supported for automatic mutation. Please add the plugin manually.",
					};
				}
				const arg = call.$args?.[0];
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
				error: "Could not find default export object in Rsbuild config",
			};
		}

		if (!config.plugins) {
			config.plugins = [];
		}

		if (Array.isArray(config.plugins)) {
			// Find identifier names imported from @arkenv/rsbuild-plugin (supports aliases)
			const rsbuildPluginImports = new Set<string>();
			for (const item of mod.imports.$items || []) {
				if (item.from && item.from.startsWith("@arkenv/rsbuild-plugin")) {
					rsbuildPluginImports.add(item.local);
				}
			}
			rsbuildPluginImports.add("arkenvRsbuildPlugin");

			// Check if already registered in the plugins array AST
			const pluginsList = Array.from(config.plugins as any[]);
			const hasPlugin = pluginsList.some((p) => {
				if (typeof p !== "object" || !p || !("$type" in p)) return false;
				if (p.$type === "function-call") {
					return (
						typeof p.$callee === "string" && rsbuildPluginImports.has(p.$callee)
					);
				}
				if (p.$type === "identifier") {
					return (
						p.$ast?.type === "Identifier" &&
						rsbuildPluginImports.has(p.$ast.name)
					);
				}
				return false;
			});

			if (!hasPlugin) {
				const rsbuildImports = (mod.imports.$items || []).filter(
					(item) => item.from && item.from.startsWith("@arkenv/rsbuild-plugin"),
				);
				const existingImport =
					rsbuildImports.find(
						(item) =>
							item.imported === "arkenvRsbuildPlugin" ||
							item.imported === "default",
					) || rsbuildImports[0];
				const localName = existingImport?.local || "arkenvRsbuildPlugin";

				if (!existingImport) {
					mod.imports.$add({
						from: "@arkenv/rsbuild-plugin",
						local: "arkenvRsbuildPlugin",
						imported: "arkenvRsbuildPlugin",
					});
				}

				const placeholder =
					localName === "arkenvRsbuildPlugin"
						? "__ARK_PLUGIN__"
						: `__ARK_PLUGIN__:${localName}`;
				config.plugins.push(placeholder);
			} else {
				// Already has plugin, nothing to do
				return { success: true, updated: false };
			}
		} else {
			return {
				success: false,
				updated: false,
				error: "The 'plugins' property in your Rsbuild config is not an array.",
			};
		}

		let code = generateCode(mod, {
			format: detectCodeFormat(initialCode),
		}).code;
		code = code.replace(/['"]__ARK_PLUGIN__(?::(.+?))?['"]/g, (_, name) =>
			name ? `${name}()` : "arkenvRsbuildPlugin()",
		);
		code = normalizeImportSpacing(code);
		code = preserveTrailingNewline(code, initialCode);

		return { success: true, updated: true, code };
	} catch (e: unknown) {
		const error = e instanceof Error ? e.message : String(e);
		return {
			success: false,
			updated: false,
			error: `Failed to parse Rsbuild config: ${error}`,
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
	disableCodegen?: boolean,
): Promise<BootstrapResult> {
	try {
		const configCode = await workspace.readFile(filePath);
		const result = transformNextjsConfig({
			code: configCode,
			disableCodegen,
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

/**
 * Search for a Nuxt configuration file in the given directory.
 */
export async function findNuxtConfig(
	cwd = process.cwd(),
): Promise<string | null> {
	const filenames = [
		"nuxt.config.ts",
		"nuxt.config.js",
		"nuxt.config.mts",
		"nuxt.config.mjs",
		"nuxt.config.cjs",
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
 * Bootstrap a Nuxt config file by adding '@arkenv/nuxt/module' to its modules.
 */
export async function bootstrapNuxtConfig(
	workspace: {
		readFile(path: string): Promise<string>;
		writeFile(path: string, content: string): Promise<void>;
	},
	filePath: string,
): Promise<BootstrapResult> {
	try {
		const configCode = await workspace.readFile(filePath);
		const result = transformNuxtConfig({
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
	_importPath?: string,
): Promise<BootstrapResult> {
	try {
		const configCode = await workspace.readFile(filePath);
		const result = transformViteConfig({
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

export async function findRsbuildConfig(
	cwd = process.cwd(),
): Promise<string | null> {
	const filenames = [
		"rsbuild.config.ts",
		"rsbuild.config.js",
		"rsbuild.config.mjs",
		"rsbuild.config.cjs",
		"rsbuild.config.mts",
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

export async function bootstrapRsbuildConfig(
	workspace: {
		readFile(path: string): Promise<string>;
		writeFile(path: string, content: string): Promise<void>;
	},
	filePath: string,
): Promise<BootstrapResult> {
	try {
		const configCode = await workspace.readFile(filePath);
		const result = transformRsbuildConfig({
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

			${code('import arkenvPlugin from "@arkenv/bun-plugin";')}

			await Bun.build({
			  entrypoints: ["./index.ts"],
			  outdir: "./dist",
			  ${pc.green("plugins: [arkenvPlugin]")}
			});
		`;
	}

	return { success: true, instructions: instructions.trim() };
}
