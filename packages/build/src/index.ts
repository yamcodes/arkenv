import fs from "node:fs";
import path from "node:path";
import { watch as chokidarWatch, type FSWatcher } from "chokidar";

// Global watcher reference isolated to this bundle's scope
let activeWatcher: FSWatcher | undefined;

export type LayoutMode = "simple" | "strict";

export type ResolvedLayout = {
	layout: LayoutMode;
	baseDir: string;
};

export type Logger = {
	error: (msg: string) => void;
	info?: (msg: string) => void;
};

/**
 * Resolve the layout mode and base directory for a given schema file path.
 *
 * @param schemaPath The absolute path to the schema file or directory
 * @param layoutOption An optional explicit layout configuration ("simple" or "strict")
 * @returns An object containing the resolved layout mode and the base directory path
 * @throws An error if explicit "strict" layout is requested but required split files are missing
 */
export function resolveLayout(
	schemaPath: string,
	layoutOption?: LayoutMode,
): ResolvedLayout {
	const checkStrict = (dir: string) =>
		fs.existsSync(path.join(dir, "internal", "shared.ts")) &&
		fs.existsSync(path.join(dir, "client.ts")) &&
		fs.existsSync(path.join(dir, "server.ts"));

	const resolveBaseDir = (p: string): string => {
		const ext = path.extname(p);
		const baseWithoutExt = ext ? p.slice(0, -ext.length) : p;
		if (
			fs.existsSync(baseWithoutExt) &&
			fs.statSync(baseWithoutExt).isDirectory()
		) {
			return baseWithoutExt;
		}
		return p;
	};

	if (!layoutOption) {
		const resolved = resolveBaseDir(schemaPath);
		if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
			if (checkStrict(resolved)) {
				return { layout: "strict", baseDir: resolved };
			}
			return { layout: "simple", baseDir: resolved };
		}

		const parent = path.dirname(schemaPath);
		const ext = path.extname(schemaPath);
		const baseWithoutExt = ext ? schemaPath.slice(0, -ext.length) : schemaPath;
		if (
			fs.existsSync(baseWithoutExt) &&
			fs.statSync(baseWithoutExt).isDirectory() &&
			checkStrict(baseWithoutExt)
		) {
			return { layout: "strict", baseDir: baseWithoutExt };
		}
		if (checkStrict(parent)) {
			return { layout: "strict", baseDir: parent };
		}
		if (
			path.basename(parent) === "internal" &&
			checkStrict(path.dirname(parent))
		) {
			return { layout: "strict", baseDir: path.dirname(parent) };
		}
		return { layout: "simple", baseDir: schemaPath };
	}

	if (layoutOption === "strict") {
		let baseDir: string;
		const resolved = resolveBaseDir(schemaPath);
		if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
			baseDir = resolved;
		} else {
			const parent = path.dirname(schemaPath);
			if (path.basename(parent) === "internal") {
				baseDir = path.dirname(parent);
			} else {
				baseDir = parent;
			}
		}

		const clientPath = path.join(baseDir, "client.ts");
		const sharedPath = path.join(baseDir, "internal", "shared.ts");
		if (!fs.existsSync(clientPath) || !fs.existsSync(sharedPath)) {
			throw new Error(
				`[ArkEnv] Strict layout requires "${clientPath}" and "${sharedPath}" to exist. ` +
					`Ensure both files are present or remove the 'layout: "strict"' option to let ArkEnv auto-detect.`,
			);
		}

		return { layout: "strict", baseDir };
	}

	return { layout: "simple", baseDir: schemaPath };
}

/**
 * Find the path to the schema file or directory in the project.
 *
 * @param cwd The working directory to search from (defaults to process.cwd())
 * @returns The absolute path to the schema file/directory, or null if not found
 */
export function findSchemaPath(cwd = process.cwd()): string | null {
	const possiblePaths = [
		path.join(cwd, "src", "env.ts"),
		path.join(cwd, "env.ts"),
	];
	for (const p of possiblePaths) {
		if (fs.existsSync(p)) return p;
	}

	const possibleDirs = [path.join(cwd, "src", "env"), path.join(cwd, "env")];
	for (const d of possibleDirs) {
		if (
			fs.existsSync(d) &&
			fs.existsSync(path.join(d, "internal", "shared.ts")) &&
			fs.existsSync(path.join(d, "client.ts")) &&
			fs.existsSync(path.join(d, "server.ts"))
		) {
			return d;
		}
	}
	return null;
}

/**
 * Extract environment variable keys statically from the schema file content.
 *
 * @param content The string content of the schema file
 * @returns An object containing arrays of server, client, and shared keys
 */
function extractCallArguments(
	content: string,
): { schemaArg: string; optionsArg: string | null } | null {
	const callRegex = /\b(?:arkenv|createEnv)\s*\(/g;
	let match = callRegex.exec(content);

	while (match !== null) {
		const start = callRegex.lastIndex;
		let parenCount = 1;
		let braceCount = 0;
		let bracketCount = 0;
		const args: string[] = [];
		let lastIndex = start;

		const tokenRegex =
			/\/\/.*|\/\*[\s\S]*?\*\/|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\$]|\\[\s\S]|\${[\s\S]*?})*`|[(){}[\],]/g;
		tokenRegex.lastIndex = start;

		let tokenMatch = tokenRegex.exec(content);
		while (parenCount > 0 && tokenMatch !== null) {
			const token = tokenMatch[0];
			const index = tokenMatch.index;

			if (token === "(") {
				parenCount++;
			} else if (token === ")") {
				parenCount--;
			} else if (token === "{") {
				braceCount++;
			} else if (token === "}") {
				braceCount--;
			} else if (token === "[") {
				bracketCount++;
			} else if (token === "]") {
				bracketCount--;
			} else if (
				token === "," &&
				parenCount === 1 &&
				braceCount === 0 &&
				bracketCount === 0
			) {
				args.push(content.slice(lastIndex, index).trim());
				lastIndex = tokenRegex.lastIndex;
			}
			tokenMatch = tokenRegex.exec(content);
		}

		if (parenCount === 0) {
			args.push(content.slice(lastIndex, tokenRegex.lastIndex - 1).trim());
			return {
				schemaArg: args[0] || "",
				optionsArg: args[1] || null,
			};
		}
		match = callRegex.exec(content);
	}
	return null;
}

/**
 * Statically extract client, shared, and server keys from the schema content.
 * Supports both legacy nested layout and the flat layout with parameterizable public prefix.
 *
 * @param content The schema file string content
 * @param publicPrefix An optional framework-specific public prefix (e.g. "NEXT_PUBLIC_" or "NUXT_PUBLIC_")
 * @returns An object containing arrays of server, client, and shared keys
 */
export function extractKeys(
	content: string,
	publicPrefix?: string,
): {
	serverKeys: string[];
	clientKeys: string[];
	sharedKeys: string[];
	isLegacy?: boolean;
} {
	const serverKeys: string[] = [];
	const clientKeys: string[] = [];
	const sharedKeys: string[] = [];

	const args = extractCallArguments(content);
	if (!args) {
		return { serverKeys, clientKeys, sharedKeys, isLegacy: false };
	}

	// Strip outer braces if present
	const trimmedSchema = args.schemaArg
		.replace(/^\{/, "")
		.replace(/\}$/, "")
		.trim();
	const topKeys = parseBlockKeys(trimmedSchema);
	const isLegacy =
		topKeys.includes("client") ||
		topKeys.includes("server") ||
		topKeys.includes("shared");

	if (isLegacy) {
		const clientBlock = extractBlock(args.schemaArg, "client");
		if (clientBlock) {
			clientKeys.push(...parseBlockKeys(clientBlock));
		}
		const sharedBlock = extractBlock(args.schemaArg, "shared");
		if (sharedBlock) {
			sharedKeys.push(...parseBlockKeys(sharedBlock));
		}
		const serverBlock = extractBlock(args.schemaArg, "server");
		if (serverBlock) {
			serverKeys.push(...parseBlockKeys(serverBlock));
		}
	} else {
		// New flat layout
		const optionExposedKeys: string[] = [];
		if (args.optionsArg) {
			const exposeMatch =
				args.optionsArg.match(/exposeToClient\s*:\s*\[([\s\S]*?)\]/) ||
				args.optionsArg.match(/expose\s*:\s*\[([\s\S]*?)\]/) ||
				args.optionsArg.match(/shared\s*:\s*\[([\s\S]*?)\]/);
			if (exposeMatch) {
				const matches = exposeMatch[1].matchAll(/['"`](.*?)['"`]/g);
				for (const match of matches) {
					optionExposedKeys.push(match[1]);
				}
			}
		}

		for (const key of topKeys) {
			if (optionExposedKeys.includes(key) || key === "NODE_ENV") {
				sharedKeys.push(key);
			} else if (publicPrefix && key.startsWith(publicPrefix)) {
				clientKeys.push(key);
			} else {
				serverKeys.push(key);
			}
		}
	}

	return { serverKeys, clientKeys, sharedKeys, isLegacy };
}

/**
 * Extract the body of a specific block (e.g. 'server', 'client', or 'shared') from the schema content.
 *
 * @param content The string content of the schema file
 * @param blockName The name of the block to extract
 * @returns The body of the block as a string, or null if not found
 */
export function extractBlock(
	content: string,
	blockName: string,
): string | null {
	const regex = new RegExp(
		`\\b${blockName}\\s*:\\s*(?:[a-zA-Z0-9_$.]+\\s*\\(\\s*)?\\{`,
		"g",
	);
	const match = regex.exec(content);
	if (!match) return null;

	const start = regex.lastIndex;
	let braceCount = 1;

	const tokenRegex =
		/\/\/.*|\/\*[\s\S]*?\*\/|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\$]|\\[\s\S]|\${[\s\S]*?})*`|[{}]/g;
	tokenRegex.lastIndex = start;

	let tokenMatch = tokenRegex.exec(content);
	while (braceCount > 0 && tokenMatch !== null) {
		const token = tokenMatch[0];
		if (token === "{") {
			braceCount++;
		} else if (token === "}") {
			braceCount--;
		}
		tokenMatch = tokenRegex.exec(content);
	}

	if (braceCount === 0) {
		return content.slice(start, tokenRegex.lastIndex - 1).trim();
	}
	return null;
}

/**
 * Parse environment variable keys from the extracted block content.
 *
 * @param blockContent The raw body string of the schema block
 * @returns An array of parsed key names
 */
export function parseBlockKeys(blockContent: string): string[] {
	const keys: string[] = [];
	const tokenRegex =
		/\/\/.*|\/\*[\s\S]*?\*\/|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\$]|\\[\s\S]|\${[\s\S]*?})*`|[{}[\]:]|[a-zA-Z0-9_$]+/g;

	let lastIdentifier = "";
	let lastString = "";
	let braceDepth = 0;
	let bracketDepth = 0;

	let match = tokenRegex.exec(blockContent);
	while (match !== null) {
		const token = match[0];

		if (token === "{") {
			braceDepth++;
			lastIdentifier = "";
			lastString = "";
		} else if (token === "}") {
			braceDepth--;
			lastIdentifier = "";
			lastString = "";
		} else if (token === "[") {
			bracketDepth++;
			lastIdentifier = "";
			lastString = "";
		} else if (token === "]") {
			bracketDepth--;
			lastIdentifier = "";
			lastString = "";
		} else if (token === ":") {
			if (braceDepth === 0 && bracketDepth === 0) {
				const key = lastIdentifier || lastString;
				if (key) {
					keys.push(key);
				}
			}
			lastIdentifier = "";
			lastString = "";
		} else if (
			token.startsWith("'") ||
			token.startsWith('"') ||
			token.startsWith("`")
		) {
			lastString = token.slice(1, -1);
			lastIdentifier = "";
		} else if (/^[a-zA-Z0-9_$]+$/.test(token)) {
			lastIdentifier = token;
			lastString = "";
		} else {
			lastIdentifier = "";
			lastString = "";
		}
		match = tokenRegex.exec(blockContent);
	}

	return keys;
}

/**
 * Extract the body of the `arkenv` function call block from the schema content.
 *
 * @param content The string content of the schema file
 * @returns The body of the block as a string, or null if not found
 */
export function extractArkenvBlock(content: string): string | null {
	const regex = /\barkenv\s*\(\s*(?:[a-zA-Z0-9_$.]+\s*\(\s*)*\{/g;
	const match = regex.exec(content);
	if (!match) return null;

	const start = regex.lastIndex;
	let braceCount = 1;

	const tokenRegex =
		/\/\/.*|\/\*[\s\S]*?\*\/|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\$]|\\[\s\S]|\${[\s\S]*?})*`|[{}]/g;
	tokenRegex.lastIndex = start;

	let tokenMatch = tokenRegex.exec(content);
	while (braceCount > 0 && tokenMatch !== null) {
		const token = tokenMatch[0];
		if (token === "{") {
			braceCount++;
		} else if (token === "}") {
			braceCount--;
		}
		tokenMatch = tokenRegex.exec(content);
	}

	if (braceCount === 0) {
		return content.slice(start, tokenRegex.lastIndex - 1).trim();
	}
	return null;
}

/**
 * Extract environment variable keys statically from client schema file content.
 *
 * @param content The string content of the client schema file
 * @returns An array of extracted client keys
 */
export function extractClientKeys(content: string): string[] {
	const block = extractArkenvBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract environment variable keys statically from server schema file content.
 *
 * @param content The string content of the server schema file
 * @returns An array of extracted server keys
 */
export function extractServerKeys(content: string): string[] {
	const block = extractArkenvBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract environment variable keys statically from shared schema file content.
 *
 * @param content The string content of the shared schema file
 * @returns An array of extracted shared keys
 */
export function extractSharedKeys(content: string): string[] {
	const block = extractSharedBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract the body of the `SharedSchema` variable assignment block from the schema content.
 *
 * @param content The string content of the schema file
 * @returns The body of the block as a string, or null if not found
 */
export function extractSharedBlock(content: string): string | null {
	const regex = /\bSharedSchema\s*=\s*(?:[a-zA-Z0-9_$.]+\s*\(\s*)*\{/g;
	const match = regex.exec(content);
	if (!match) return null;

	const startIndex = regex.lastIndex;
	let braceCount = 1;
	let index = startIndex;
	let inString: string | null = null;
	let inComment: "single" | "multi" | null = null;

	while (index < content.length && braceCount > 0) {
		const char = content[index];
		const nextChar = content[index + 1];

		if (inComment === "single") {
			if (char === "\n" || char === "\r") inComment = null;
			index++;
			continue;
		}
		if (inComment === "multi") {
			if (char === "*" && nextChar === "/") {
				inComment = null;
				index += 2;
				continue;
			}
			index++;
			continue;
		}

		if (inString) {
			if (char === inString && content[index - 1] !== "\\") {
				inString = null;
			}
			index++;
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inComment = "single";
			index += 2;
			continue;
		}
		if (char === "/" && nextChar === "*") {
			inComment = "multi";
			index += 2;
			continue;
		}
		if (char === "'" || char === '"' || char === "`") {
			inString = char;
			index++;
			continue;
		}

		if (char === "{") {
			braceCount++;
		} else if (char === "}") {
			braceCount--;
		}
		index++;
	}

	if (braceCount === 0) {
		return content.slice(startIndex, index - 1);
	}

	return null;
}

/**
 * Watch the schema file(s) for changes and automatically run a callback on change.
 *
 * @param schemaPath The absolute path or list of paths of schema files to watch
 * @param onTrigger The callback to trigger when files change
 * @param logger An optional logger instance to record error messages
 */
export function watchSchema(
	schemaPath: string | string[],
	onTrigger: () => void,
	logger?: Logger,
): void {
	const previousWatcher = activeWatcher;

	const startWatch = () => {
		try {
			const watcher = chokidarWatch(schemaPath, { ignoreInitial: true });
			activeWatcher = watcher;

			watcher.on("change", () => {
				try {
					onTrigger();
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					if (logger) {
						logger.error(`Failed to regenerate env: ${message}`);
					} else {
						console.error(
							`[ArkEnv Watcher] Failed to regenerate env: ${message}`,
						);
					}
				}
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			if (logger) {
				logger.error(`Failed to start watch on ${schemaPath}: ${message}`);
			} else {
				console.error(
					`[ArkEnv Watcher] Failed to start watch on ${schemaPath}: ${message}`,
				);
			}
		}
	};

	if (previousWatcher && typeof previousWatcher.close === "function") {
		previousWatcher.close().catch((err: unknown) => {
			const message = err instanceof Error ? err.message : String(err);
			if (logger) {
				logger.error(`Failed to close previous watcher: ${message}`);
			} else {
				console.error(
					`[ArkEnv Watcher] Failed to close previous watcher: ${message}`,
				);
			}
		});
	}
	startWatch();
}

/**
 * Close the schema watcher if one is running.
 *
 * @param logger An optional logger instance to record errors
 */
export async function closeWatcher(logger?: Logger): Promise<void> {
	const watcher = activeWatcher;
	if (watcher && typeof watcher.close === "function") {
		try {
			await watcher.close();
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			if (logger) {
				logger.error(`Failed to close watcher: ${message}`);
			} else {
				console.error(`[ArkEnv Watcher] Failed to close watcher: ${message}`);
			}
		} finally {
			activeWatcher = undefined;
		}
	}
}
