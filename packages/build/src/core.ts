import fs from "node:fs";
import path from "node:path";
import {
	formatBuildError,
	logErrorWithCauseVia,
	logWatcherErrorWithCause,
} from "@repo/utils";
import { watch as chokidarWatch, type FSWatcher } from "chokidar";

// Global watcher reference isolated to this bundle's scope
let activeWatcher: FSWatcher | undefined;

export type LayoutMode = "simple" | "strict";

/** Public layout values accepted by {@link resolveLayout}. */
export type LayoutInput = LayoutMode | "flat";

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
 * @param layoutOption An optional explicit layout configuration ("flat", "simple", or "strict")
 * @returns An object containing the resolved layout mode and the base directory path
 * @throws An error if explicit "strict" layout is requested but required split files are missing
 */
export function resolveLayout(
	schemaPath: string,
	layoutOption?: LayoutInput,
): ResolvedLayout {
	const layout = layoutOption === "flat" ? "simple" : layoutOption;
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

	if (!layout) {
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

	if (layout === "strict") {
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
				formatBuildError(
					`Strict layout requires "${clientPath}" and "${sharedPath}" to exist. ` +
						`Ensure both files are present or remove the 'layout: "strict"' option to let ArkEnv auto-detect.`,
				),
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
 * Extract the schema and options arguments from an `arkenv` or `createEnv` call.
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
			if (parenCount === 0) {
				break;
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
 * Extract environment variable keys statically from the schema file content.
 * Supports both legacy nested layout and flat layout with a parameterizable public prefix.
 *
 * @param content The string content of the schema file
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
		const serverBlock = extractBlock(content, "server");
		if (serverBlock) {
			serverKeys.push(...parseBlockKeys(serverBlock));
		}

		const clientBlock = extractBlock(content, "client");
		if (clientBlock) {
			clientKeys.push(...parseBlockKeys(clientBlock));
		}

		const sharedBlock = extractBlock(content, "shared");
		if (sharedBlock) {
			sharedKeys.push(...parseBlockKeys(sharedBlock));
		}

		return { serverKeys, clientKeys, sharedKeys, isLegacy: true };
	}

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
		const optionExposedKeys: string[] = [];
		if (args.optionsArg) {
			const exposeMatch =
				args.optionsArg.match(/exposeToClient\s*:\s*\[([\s\S]*?)\]/) ||
				args.optionsArg.match(/expose\s*:\s*\[([\s\S]*?)\]/) ||
				args.optionsArg.match(/shared\s*:\s*\[([\s\S]*?)\]/);
			if (exposeMatch) {
				const matches = exposeMatch[1].matchAll(/['"`](.*?)['"`]/g);
				for (const exposeMatchResult of matches) {
					optionExposedKeys.push(exposeMatchResult[1]);
				}
			}
		}

		const assignFlatKeys = (keys: string[]) => {
			for (const key of keys) {
				if (optionExposedKeys.includes(key) || key === "NODE_ENV") {
					sharedKeys.push(key);
				} else if (publicPrefix && key.startsWith(publicPrefix)) {
					clientKeys.push(key);
				} else {
					serverKeys.push(key);
				}
			}
		};

		assignFlatKeys(topKeys);

		if (
			topKeys.length === 0 &&
			trimmedSchema.length > 0 &&
			/\b[A-Z][A-Z0-9_]*\s*:/.test(trimmedSchema)
		) {
			const fallbackBlock = extractArkenvBlock(content);
			if (fallbackBlock) {
				assignFlatKeys(parseBlockKeys(fallbackBlock));
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
 * Parse environment variable keys from the extracted block content.
 *
 * @param blockContent The raw body string of the schema block
 * @returns An array of parsed key names
 */
export function parseBlockKeys(blockContent: string): string[] {
	const keys: string[] = [];
	let inString: string | null = null;
	let inComment: "single" | "multi" | null = null;
	let currentToken = "";
	let lastStringContent = "";
	let braceDepth = 0;

	for (let i = 0; i < blockContent.length; i++) {
		const char = blockContent[i];
		const nextChar = blockContent[i + 1];

		if (inComment === "single") {
			if (char === "\n" || char === "\r") inComment = null;
			continue;
		}
		if (inComment === "multi") {
			if (char === "*" && nextChar === "/") {
				inComment = null;
				i++;
			}
			continue;
		}

		if (inString) {
			if (char === inString && blockContent[i - 1] !== "\\") {
				inString = null;
				lastStringContent = currentToken;
				currentToken = "";
			} else {
				currentToken += char;
			}
			continue;
		}

		if (char === "/" && nextChar === "/") {
			inComment = "single";
			i++;
			continue;
		}
		if (char === "/" && nextChar === "*") {
			inComment = "multi";
			i++;
			continue;
		}
		if (char === "'" || char === '"' || char === "`") {
			inString = char;
			currentToken = "";
			continue;
		}

		if (char === "{") {
			braceDepth++;
			currentToken = "";
			lastStringContent = "";
			continue;
		}
		if (char === "}") {
			braceDepth--;
			currentToken = "";
			lastStringContent = "";
			continue;
		}

		if (char === ":") {
			if (braceDepth === 0) {
				const key = currentToken.trim() || lastStringContent.trim();
				if (key) {
					keys.push(key);
				}
			}
			currentToken = "";
			lastStringContent = "";
			continue;
		}

		if (/[a-zA-Z0-9_$]/.test(char)) {
			currentToken += char;
		} else if (char === "," || char === "\n" || char === "\r") {
			currentToken = "";
			lastStringContent = "";
		}
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
					const header = "Failed to regenerate env";
					if (logger) {
						logErrorWithCauseVia(logger.error.bind(logger), header, err);
					} else {
						logWatcherErrorWithCause(header, err);
					}
				}
			});
		} catch (err: unknown) {
			const header = `Failed to start watch on ${schemaPath}`;
			if (logger) {
				logErrorWithCauseVia(logger.error.bind(logger), header, err);
			} else {
				logWatcherErrorWithCause(header, err);
			}
		}
	};

	if (previousWatcher && typeof previousWatcher.close === "function") {
		previousWatcher.close().catch((err: unknown) => {
			const header = "Failed to close previous watcher";
			if (logger) {
				logErrorWithCauseVia(logger.error.bind(logger), header, err);
			} else {
				logWatcherErrorWithCause(header, err);
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
			const header = "Failed to close watcher";
			if (logger) {
				logErrorWithCauseVia(logger.error.bind(logger), header, err);
			} else {
				logWatcherErrorWithCause(header, err);
			}
		} finally {
			activeWatcher = undefined;
		}
	}
}
