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
 * Represents a parsed managed preset comment block.
 */
export type PresetBlock = {
	markerId: string;
	baseId: string;
	role?: string;
	startLineIndex: number;
	endLineIndex: number;
	rawContent: string;
	innerContent: string;
	keys: string[];
};

/**
 * Validates and finds all managed preset comment blocks in the given source code.
 * Fails closed on any malformed or unbalanced start/end markers.
 *
 * @param code The source code to inspect.
 * @returns Result object with blocks on success or error message on failure.
 */
export function validateAndFindPresetBlocks(
	code: string,
):
	| { success: true; blocks: PresetBlock[] }
	| { success: false; error: string } {
	const lines = code.split(/\r?\n/);
	const blocks: PresetBlock[] = [];
	let activeStart: {
		markerId: string;
		startLineIndex: number;
	} | null = null;

	const startRegex = /^\s*\/\/\s*@arkenv-preset-start\s+([a-zA-Z0-9_:-]+)\s*$/;
	const endRegex = /^\s*\/\/\s*@arkenv-preset-end\s+([a-zA-Z0-9_:-]+)\s*$/;
	const keyRegex = /^\s*([A-Za-z_][A-Za-z0-9_]*|'[^']+'|"[^"]+")\s*:/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const startMatch = line.match(startRegex);
		if (startMatch) {
			if (activeStart) {
				return {
					success: false,
					error: `Malformed preset markers: nested or unclosed "@arkenv-preset-start ${activeStart.markerId}" before line ${i + 1}.`,
				};
			}
			activeStart = {
				markerId: startMatch[1].trim(),
				startLineIndex: i,
			};
			continue;
		}

		const endMatch = line.match(endRegex);
		if (endMatch) {
			const endMarkerId = endMatch[1].trim();
			if (!activeStart) {
				return {
					success: false,
					error: `Malformed preset markers: unexpected "@arkenv-preset-end ${endMarkerId}" without matching start marker at line ${i + 1}.`,
				};
			}
			if (activeStart.markerId !== endMarkerId) {
				return {
					success: false,
					error: `Malformed preset markers: mismatched start "${activeStart.markerId}" (line ${activeStart.startLineIndex + 1}) and end "${endMarkerId}" (line ${i + 1}).`,
				};
			}

			const blockLines = lines.slice(activeStart.startLineIndex, i + 1);
			const innerLines = lines.slice(activeStart.startLineIndex + 1, i);
			const keys: string[] = [];

			for (const innerLine of innerLines) {
				const kMatch = innerLine.match(keyRegex);
				if (kMatch) {
					const rawKey = kMatch[1];
					const cleanKey =
						rawKey.startsWith("'") || rawKey.startsWith('"')
							? rawKey.slice(1, -1)
							: rawKey;
					keys.push(cleanKey);
				}
			}

			const parsedId = parseMarkerId(activeStart.markerId);
			blocks.push({
				markerId: activeStart.markerId,
				baseId: parsedId.baseId,
				...(parsedId.role !== undefined ? { role: parsedId.role } : {}),
				startLineIndex: activeStart.startLineIndex,
				endLineIndex: i,
				rawContent: blockLines.join("\n"),
				innerContent: innerLines.join("\n"),
				keys,
			});

			activeStart = null;
		}
	}

	if (activeStart) {
		return {
			success: false,
			error: `Malformed preset markers: unclosed "@arkenv-preset-start ${activeStart.markerId}" starting at line ${activeStart.startLineIndex + 1}.`,
		};
	}

	return { success: true, blocks };
}

/**
 * Parses the marker ID string into base ID and optional role.
 */
function parseMarkerId(markerId: string): { baseId: string; role?: string } {
	const colonIndex = markerId.indexOf(":");
	if (colonIndex === -1) {
		return { baseId: markerId };
	}
	return {
		baseId: markerId.slice(0, colonIndex),
		role: markerId.slice(colonIndex + 1),
	};
}

/**
 * Options for applying a preset to a schema source string.
 */
export type ApplyPresetOptions = {
	preset: HostPreset;
	framework: Framework;
	validator: Validator;
	targetKeys?: string[];
	markerId?: string;
};

/**
 * Scans for the matching closing brace '}' starting from a given '{' position,
 * correctly ignoring braces inside single-quoted strings, double-quoted strings,
 * template literals, single-line comments, and multi-line comments.
 */
function scanMatchingBrace(
	lines: string[],
	startLine: number,
	startChar: number,
): { endLine: number; endChar: number } | null {
	let depth = 0;
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let inTemplate = false;
	const templateStack: number[] = [];
	let inBlockComment = false;

	for (let i = startLine; i < lines.length; i++) {
		const line = lines[i];
		const startCol = i === startLine ? startChar : 0;
		let inLineComment = false;

		for (let c = startCol; c < line.length; c++) {
			const ch = line[c];
			const nextCh = c + 1 < line.length ? line[c + 1] : "";
			const prevCh = c > 0 ? line[c - 1] : "";

			if (inLineComment) {
				break;
			}

			if (inBlockComment) {
				if (ch === "*" && nextCh === "/") {
					inBlockComment = false;
					c++;
				}
				continue;
			}

			if (inSingleQuote) {
				if (ch === "'" && prevCh !== "\\") {
					inSingleQuote = false;
				}
				continue;
			}

			if (inDoubleQuote) {
				if (ch === '"' && prevCh !== "\\") {
					inDoubleQuote = false;
				}
				continue;
			}

			if (inTemplate) {
				if (ch === "`" && prevCh !== "\\") {
					inTemplate = false;
				} else if (ch === "$" && nextCh === "{" && prevCh !== "\\") {
					templateStack.push(depth);
					inTemplate = false;
					depth++;
					c++;
				}
				continue;
			}

			// Not inside any string or comment:
			if (ch === "/" && nextCh === "/") {
				inLineComment = true;
				c++;
				continue;
			}

			if (ch === "/" && nextCh === "*") {
				inBlockComment = true;
				c++;
				continue;
			}

			if (ch === "'") {
				inSingleQuote = true;
				continue;
			}

			if (ch === '"') {
				inDoubleQuote = true;
				continue;
			}

			if (ch === "`") {
				inTemplate = true;
				continue;
			}

			if (ch === "{") {
				depth++;
			} else if (ch === "}") {
				depth--;
				if (depth === 0) {
					return { endLine: i, endChar: c };
				}
				if (
					templateStack.length > 0 &&
					depth === templateStack[templateStack.length - 1]
				) {
					templateStack.pop();
					inTemplate = true;
				}
			}
		}
	}

	return null;
}

/**
 * Locates the opening brace '{' of the schema object literal, correctly handling
 * multiline calls where '{' is placed on subsequent lines (e.g. arkenv(\n  { ... })).
 */
function findSchemaOpeningBrace(
	lines: string[],
): { line: number; char: number } | null {
	const schemaCallRegex = /\b(?:arkenv|type|z\.object|v\.object)\s*\(/;

	for (let i = 0; i < lines.length; i++) {
		const match = lines[i].match(schemaCallRegex);
		if (match && match.index !== undefined) {
			let inSingleQuote = false;
			let inDoubleQuote = false;
			let inTemplate = false;
			let inBlockComment = false;

			for (let lineIdx = i; lineIdx < lines.length; lineIdx++) {
				const line = lines[lineIdx];
				const colStart = lineIdx === i ? match.index + match[0].length : 0;
				let inLineComment = false;

				for (let c = colStart; c < line.length; c++) {
					const ch = line[c];
					const nextCh = c + 1 < line.length ? line[c + 1] : "";
					const prevCh = c > 0 ? line[c - 1] : "";

					if (inLineComment) break;

					if (inBlockComment) {
						if (ch === "*" && nextCh === "/") {
							inBlockComment = false;
							c++;
						}
						continue;
					}

					if (inSingleQuote) {
						if (ch === "'" && prevCh !== "\\") inSingleQuote = false;
						continue;
					}

					if (inDoubleQuote) {
						if (ch === '"' && prevCh !== "\\") inDoubleQuote = false;
						continue;
					}

					if (inTemplate) {
						if (ch === "`" && prevCh !== "\\") inTemplate = false;
						continue;
					}

					if (ch === "/" && nextCh === "/") {
						inLineComment = true;
						c++;
						continue;
					}

					if (ch === "/" && nextCh === "*") {
						inBlockComment = true;
						c++;
						continue;
					}

					if (ch === "'") {
						inSingleQuote = true;
						continue;
					}

					if (ch === '"') {
						inDoubleQuote = true;
						continue;
					}

					if (ch === "`") {
						inTemplate = true;
						continue;
					}

					if (ch === "{") {
						return { line: lineIdx, char: c };
					}

					if (ch === ";" && lineIdx > i) {
						break;
					}
				}
			}
		}
	}

	// Fallback: search after `export const ... =`
	const exportConstRegex = /\bexport\s+const\s+[\w$]+\s*=\s*/;
	for (let i = 0; i < lines.length; i++) {
		const match = lines[i].match(exportConstRegex);
		if (match && match.index !== undefined) {
			let inSingleQuote = false;
			let inDoubleQuote = false;
			let inTemplate = false;
			let inBlockComment = false;

			for (let lineIdx = i; lineIdx < lines.length; lineIdx++) {
				const line = lines[lineIdx];
				const colStart = lineIdx === i ? match.index + match[0].length : 0;
				let inLineComment = false;

				for (let c = colStart; c < line.length; c++) {
					const ch = line[c];
					const nextCh = c + 1 < line.length ? line[c + 1] : "";
					const prevCh = c > 0 ? line[c - 1] : "";

					if (inLineComment) break;

					if (inBlockComment) {
						if (ch === "*" && nextCh === "/") {
							inBlockComment = false;
							c++;
						}
						continue;
					}

					if (inSingleQuote) {
						if (ch === "'" && prevCh !== "\\") inSingleQuote = false;
						continue;
					}

					if (inDoubleQuote) {
						if (ch === '"' && prevCh !== "\\") inDoubleQuote = false;
						continue;
					}

					if (inTemplate) {
						if (ch === "`" && prevCh !== "\\") inTemplate = false;
						continue;
					}

					if (ch === "/" && nextCh === "/") {
						inLineComment = true;
						c++;
						continue;
					}

					if (ch === "/" && nextCh === "*") {
						inBlockComment = true;
						c++;
						continue;
					}

					if (ch === "'") {
						inSingleQuote = true;
						continue;
					}

					if (ch === '"') {
						inDoubleQuote = true;
						continue;
					}

					if (ch === "`") {
						inTemplate = true;
						continue;
					}

					if (ch === "{") {
						return { line: lineIdx, char: c };
					}

					if (ch === ";" && lineIdx > i) {
						break;
					}
				}
			}
		}
	}

	return null;
}

/**
 * Finds the schema object literal boundaries in source code.
 */
function findSchemaObjectRange(lines: string[]): {
	startLineIndex: number;
	endLineIndex: number;
	startCharIndex: number;
	endCharIndex: number;
	isSingleLine: boolean;
	indent: string;
} | null {
	const opening = findSchemaOpeningBrace(lines);
	if (!opening) return null;

	const match = scanMatchingBrace(lines, opening.line, opening.char);
	if (!match) return null;

	const startLineIndex = opening.line;
	const endLineIndex = match.endLine;
	const startCharIndex = opening.char;
	const endCharIndex = match.endChar;
	const isSingleLine = startLineIndex === endLineIndex;

	// Determine indent from lines inside the object, or default to standard indent
	let indent = "\t";
	if (!isSingleLine) {
		for (let i = startLineIndex + 1; i < endLineIndex; i++) {
			const m = lines[i].match(/^(\s+)\S/);
			if (m) {
				indent = m[1];
				break;
			}
		}
		if (indent === "\t" && lines[startLineIndex].match(/^\s+/)) {
			const baseIndent = lines[startLineIndex].match(/^(\s+)/)?.[1] || "";
			indent = baseIndent.includes("  ")
				? `${baseIndent}  `
				: `${baseIndent}\t`;
		}
	} else {
		const baseIndent = lines[startLineIndex].match(/^(\s*)/)?.[1] || "";
		indent = baseIndent.includes("  ") ? `${baseIndent}  ` : `${baseIndent}\t`;
		if (!indent.trim().length && !baseIndent) {
			indent = "\t";
		}
	}

	return {
		startLineIndex,
		endLineIndex,
		startCharIndex,
		endCharIndex,
		isSingleLine,
		indent,
	};
}

/**
 * Applies a preset to an env schema file by inserting or refreshing managed comment blocks.
 * Fails closed on any key collisions with user-owned/unmarked keys or other presets,
 * or on malformed markers.
 *
 * @param code The environment configuration code.
 * @param options Preset options.
 * @returns The mutation result.
 */
export function applyPresetToSchema(
	code: string,
	options: ApplyPresetOptions,
): {
	success: boolean;
	updated: boolean;
	code?: string;
	error?: string;
	proposedFields: Record<string, string>;
} {
	const { preset, framework, validator, targetKeys } = options;
	const prefix = FRAMEWORK_CLIENT_PREFIXES[framework] || "";
	const keysToMutate = targetKeys ?? getPresetKeys(preset, prefix);
	const proposedFields: Record<string, string> = {};

	for (const key of keysToMutate) {
		proposedFields[key] = getFieldDefinition(key, validator, prefix, preset);
	}

	// 1. Validate markers in the file
	const validation = validateAndFindPresetBlocks(code);
	if (!validation.success) {
		return {
			success: false,
			updated: false,
			error: validation.error,
			proposedFields,
		};
	}

	const blocks = validation.blocks;
	const lines = code.split(/\r?\n/);
	const schemaRange = findSchemaObjectRange(lines);

	if (!schemaRange) {
		return {
			success: false,
			updated: false,
			error: "Could not find schema object literal in schema file.",
			proposedFields,
		};
	}

	const markerId = options.markerId || preset;
	const keyRegex = /^\s*([A-Za-z_][A-Za-z0-9_]*|'[^']+'|"[^"]+")\s*:/;

	// 2. Extract keys outside managed blocks and in other presets
	const unmarkedKeys = new Set<string>();
	const otherPresetKeys = new Map<string, string>(); // key -> otherPresetId

	if (schemaRange.isSingleLine) {
		const line = lines[schemaRange.startLineIndex];
		const inside = line.slice(
			schemaRange.startCharIndex + 1,
			schemaRange.endCharIndex,
		);
		// Parse any inline keys inside { ... }
		const inlineKeyRegex =
			/(?:^|[,{\s])([A-Za-z_][A-Za-z0-9_]*|'[^']+'|"[^"]+")\s*:/g;
		for (const match of inside.matchAll(inlineKeyRegex)) {
			const rawKey = match[1];
			const cleanKey =
				rawKey.startsWith("'") || rawKey.startsWith('"')
					? rawKey.slice(1, -1)
					: rawKey;
			unmarkedKeys.add(cleanKey);
		}
	} else {
		for (
			let i = schemaRange.startLineIndex;
			i <= schemaRange.endLineIndex;
			i++
		) {
			const containingBlock = blocks.find(
				(b) => i >= b.startLineIndex && i <= b.endLineIndex,
			);

			let textToScan = lines[i];
			if (i === schemaRange.startLineIndex) {
				textToScan = textToScan.slice(schemaRange.startCharIndex + 1);
			} else if (i === schemaRange.endLineIndex) {
				textToScan = textToScan.slice(0, schemaRange.endCharIndex);
			}

			if (!textToScan.trim()) continue;

			if (!containingBlock) {
				const match = textToScan.match(keyRegex);
				if (match) {
					const rawKey = match[1];
					const cleanKey =
						rawKey.startsWith("'") || rawKey.startsWith('"')
							? rawKey.slice(1, -1)
							: rawKey;
					unmarkedKeys.add(cleanKey);
				}
			} else if (containingBlock.baseId !== preset) {
				const match = textToScan.match(keyRegex);
				if (match) {
					const rawKey = match[1];
					const cleanKey =
						rawKey.startsWith("'") || rawKey.startsWith('"')
							? rawKey.slice(1, -1)
							: rawKey;
					otherPresetKeys.set(cleanKey, containingBlock.baseId);
				}
			}
		}
	}

	// 3. Collision Checks (Fail Closed)
	for (const key of keysToMutate) {
		if (unmarkedKeys.has(key)) {
			return {
				success: false,
				updated: false,
				error: `Collision detected: Key "${key}" already exists outside managed preset blocks (user-owned or legacy unmarked). Remove or migrate it before applying preset "${preset}".`,
				proposedFields,
			};
		}
		if (otherPresetKeys.has(key)) {
			const conflictingPreset = otherPresetKeys.get(key);
			return {
				success: false,
				updated: false,
				error: `Collision detected: Key "${key}" conflicts with existing managed preset "${conflictingPreset}".`,
				proposedFields,
			};
		}
	}

	const indent = schemaRange.indent;
	const blockLines: string[] = [
		`${indent}// @arkenv-preset-start ${markerId}`,
		...keysToMutate.map((key) => `${indent}${key}: ${proposedFields[key]},`),
		`${indent}// @arkenv-preset-end ${markerId}`,
	];

	// 4. Refresh existing block or Insert new block
	const existingBlock = blocks.find((b) => b.markerId === markerId);

	if (existingBlock) {
		// Check if identical
		const currentRaw = lines
			.slice(existingBlock.startLineIndex, existingBlock.endLineIndex + 1)
			.join("\n");
		const newRaw = blockLines.join("\n");

		if (currentRaw === newRaw) {
			return {
				success: true,
				updated: false,
				code,
				proposedFields,
			};
		}

		// Nuke-and-pave
		lines.splice(
			existingBlock.startLineIndex,
			existingBlock.endLineIndex - existingBlock.startLineIndex + 1,
			...blockLines,
		);

		return {
			success: true,
			updated: true,
			code: lines.join("\n"),
			proposedFields,
		};
	}

	// Insert into schema object
	if (schemaRange.isSingleLine) {
		const line = lines[schemaRange.startLineIndex];
		const beforeBrace = line.slice(0, schemaRange.startCharIndex + 1);
		const insideContent = line
			.slice(schemaRange.startCharIndex + 1, schemaRange.endCharIndex)
			.trim();
		const afterBrace = line.slice(schemaRange.endCharIndex);
		const baseIndent = line.match(/^(\s*)/)?.[1] || "";

		if (insideContent) {
			const formattedInside = insideContent.endsWith(",")
				? insideContent
				: `${insideContent},`;
			lines.splice(
				schemaRange.startLineIndex,
				1,
				beforeBrace,
				`${indent}${formattedInside}`,
				...blockLines,
				`${baseIndent}${afterBrace.trimStart()}`,
			);
		} else {
			lines.splice(
				schemaRange.startLineIndex,
				1,
				beforeBrace,
				...blockLines,
				`${baseIndent}${afterBrace.trimStart()}`,
			);
		}

		return {
			success: true,
			updated: true,
			code: lines.join("\n"),
			proposedFields,
		};
	}

	// Multi-line: Insert before the closing brace
	// Ensure the line before has a trailing comma if it's a field
	const prevLineIdx = schemaRange.endLineIndex - 1;
	if (prevLineIdx > schemaRange.startLineIndex) {
		const prevLine = lines[prevLineIdx].trim();
		if (
			prevLine &&
			!prevLine.endsWith(",") &&
			!prevLine.startsWith("//") &&
			!prevLine.startsWith("/*")
		) {
			lines[prevLineIdx] = `${lines[prevLineIdx]},`;
		}
	}

	lines.splice(schemaRange.endLineIndex, 0, ...blockLines);

	return {
		success: true,
		updated: true,
		code: lines.join("\n"),
		proposedFields,
	};
}

/**
 * Options for removing a preset from a schema file.
 */
export type RemovePresetOptions = {
	preset: HostPreset;
};

/**
 * Removes all managed blocks belonging to a base preset ID from an env schema file.
 * Fails closed on malformed markers.
 *
 * @param code The schema file code.
 * @param options Removal options.
 * @returns The mutation result.
 */
export function removePresetFromSchema(
	code: string,
	options: RemovePresetOptions,
): {
	success: boolean;
	updated: boolean;
	code?: string;
	error?: string;
} {
	const { preset } = options;

	// 1. Validate markers
	const validation = validateAndFindPresetBlocks(code);
	if (!validation.success) {
		return {
			success: false,
			updated: false,
			error: validation.error,
		};
	}

	const matchingBlocks = validation.blocks.filter((b) => b.baseId === preset);
	if (matchingBlocks.length === 0) {
		return {
			success: true,
			updated: false,
			code,
		};
	}

	const lines = code.split(/\r?\n/);

	// Remove blocks in reverse order of line indices
	const sortedBlocks = [...matchingBlocks].sort(
		(a, b) => b.startLineIndex - a.startLineIndex,
	);

	for (const block of sortedBlocks) {
		lines.splice(
			block.startLineIndex,
			block.endLineIndex - block.startLineIndex + 1,
		);
	}

	return {
		success: true,
		updated: true,
		code: lines.join("\n"),
	};
}

/**
 * Transform an env.ts schema file by merging host preset keys.
 * Kept for backwards-compatibility; delegates to managed preset blocks.
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
	proposedFields?: Record<string, string>;
} {
	return applyPresetToSchema(code, {
		preset,
		framework,
		validator,
		...(targetKeys !== undefined ? { targetKeys } : {}),
	});
}
