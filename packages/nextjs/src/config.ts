import fs from "node:fs";
import path from "node:path";
import { watch as chokidarWatch } from "chokidar";

declare global {
	// eslint-disable-next-line no-var
	var __arkenv_watcher__: import("chokidar").FSWatcher | undefined;
}

/**
 * Configuration options for the ArkEnv Next.js integration.
 *
 * @example
 * ```ts
 * const configOptions: ArkEnvConfigOptions = {
 *   schemaPath: "./src/env.ts",
 *   outputPath: "./src/generated/env.gen.ts"
 * };
 * ```
 */
export type ArkEnvConfigOptions = {
	/**
	 * Specify the path to the schema definition file.
	 *
	 * Defaults to searching for `"src/env.ts"` or `"env.ts"` in the project root.
	 *
	 * @default "src/env.ts"
	 * @example
	 * ```ts
	 * export default withArkEnv(nextConfig, {
	 *   schemaPath: "./src/env.ts"
	 * });
	 * ```
	 */
	schemaPath?: string;

	/**
	 * Specify the path where the generated file (`env.gen.ts`) should be written.
	 *
	 * Defaults to `"generated/env.gen.ts"` in the same directory as the schema file.
	 *
	 * @default "[schemaDirectory]/generated/env.gen.ts"
	 * @example
	 * ```ts
	 * export default withArkEnv(nextConfig, {
	 *   outputPath: "./src/generated/env.gen.ts"
	 * });
	 * ```
	 */
	outputPath?: string;

	/**
	 * Specify the configuration layout.
	 *
	 * - `"simple"` (default): A single `env.ts` schema file.
	 * - `"strict"`: A 3-file split schema layout (`env/internal/shared.ts`, `env/client.ts`, `env/server.ts`).
	 *
	 * @default "simple"
	 */
	layout?: "simple" | "strict";
};

/**
 * Wrap a Next.js configuration object to automatically generate the `runtimeEnv` block in `env.gen.ts`.
 *
 * @param nextConfig The Next.js configuration object or function
 * @param options Optional configuration paths for schema and output files
 * @returns The Next.js configuration object unchanged
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function withArkEnv<T>(nextConfig: T, options?: ArkEnvConfigOptions): T {
	// 1. Locate the env.ts schema file or strict schema directory
	const schemaPath = options?.schemaPath
		? path.resolve(options.schemaPath)
		: findSchemaPath();

	// Auto-detect layout if not specified
	let exists = false;
	if (schemaPath) {
		if (fs.existsSync(schemaPath)) {
			exists = true;
		} else {
			const ext = path.extname(schemaPath);
			if (ext) {
				const baseWithoutExt = schemaPath.slice(0, -ext.length);
				if (fs.existsSync(baseWithoutExt)) {
					exists = true;
				}
			}
		}
	}

	if (!schemaPath || !exists) {
		throw new Error(
			`[ArkEnv] Could not find schema file at ${
				options?.schemaPath || "src/env.ts or env.ts"
			}. Please specify 'schemaPath' in withArkEnv options.`,
		);
	}

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		options?.layout,
	);

	// 2. Determine outputPath (defaults to generated/env.gen.ts in the same directory as schemaPath/baseDir)
	const defaultOutputDir =
		resolvedLayout === "strict" && baseDir ? baseDir : path.dirname(schemaPath);
	const defaultOutputPath = path.join(
		defaultOutputDir,
		"generated",
		"env.gen.ts",
	);
	const outputPath = options?.outputPath
		? path.resolve(options.outputPath)
		: defaultOutputPath;

	// 3. Run initial code generation
	try {
		runCodegen(schemaPath, outputPath, resolvedLayout);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`[ArkEnv] Failed to generate env.gen.ts: ${message}`);
	}

	// 4. Initialize development file watcher if in dev mode
	const isDev =
		process.env.NODE_ENV === "development" ||
		process.env.NEXT_PHASE === "phase-development-server";
	if (isDev) {
		const watchPaths =
			resolvedLayout === "strict" && baseDir
				? [
						path.join(baseDir, "internal", "shared.ts"),
						path.join(baseDir, "client.ts"),
						path.join(baseDir, "server.ts"),
					].filter(fs.existsSync)
				: [schemaPath];
		watchSchema(watchPaths, outputPath, resolvedLayout);
	}

	return nextConfig;
}

/**
 * Find the path to the schema file in the project.
 *
 * @returns The absolute path to the schema file, or null if not found
 */
/**
 * Resolve the layout (simple vs strict) and the base directory from a schema path.
 *
 * Auto-detects layout when `layoutOption` is not provided. When `layoutOption`
 * is `"strict"`, validates that the required split files exist and throws a
 * descriptive error if either is missing.
 *
 * @param schemaPath The absolute path to the schema file or directory
 * @param layoutOption The explicit layout option, if provided
 * @returns The resolved layout and base directory
 * @throws An error if strict layout files are missing
 */
function resolveLayout(
	schemaPath: string,
	layoutOption?: "simple" | "strict",
): { layout: "simple" | "strict"; baseDir: string } {
	const checkStrict = (dir: string) =>
		fs.existsSync(path.join(dir, "internal", "shared.ts")) &&
		fs.existsSync(path.join(dir, "client.ts")) &&
		fs.existsSync(path.join(dir, "server.ts"));

	const resolveBaseDir = (p: string): string => {
		// Normalize: if schemaPath has an extension, try the extensionless form as a dir
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
		// Auto-detect
		const resolved = resolveBaseDir(schemaPath);
		if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
			if (checkStrict(resolved)) {
				return { layout: "strict", baseDir: resolved };
			}
			return { layout: "simple", baseDir: resolved };
		}

		// schemaPath is a file — check surrounding dirs
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
		// Resolve baseDir for an explicit strict layout
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

		// Validate that required split files exist
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

	// layoutOption === "simple"
	return { layout: "simple", baseDir: schemaPath };
}

function findSchemaPath(): string | null {
	const possiblePaths = [
		path.join(process.cwd(), "src", "env.ts"),
		path.join(process.cwd(), "env.ts"),
	];
	for (const p of possiblePaths) {
		if (fs.existsSync(p)) return p;
	}

	const possibleDirs = [
		path.join(process.cwd(), "src", "env"),
		path.join(process.cwd(), "env"),
	];
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
 * Watch the schema file for changes and trigger codegen.
 *
 * @param schemaPath The absolute path to the schema file, or an array of paths to watch
 * @param outputPath The absolute path to the generated output file
 * @param layout The resolved layout to pass through to codegen on each change
 */
function watchSchema(
	schemaPath: string | string[],
	outputPath: string,
	layout?: "simple" | "strict",
) {
	const previousWatcher = globalThis.__arkenv_watcher__;
	if (previousWatcher && typeof previousWatcher.close === "function") {
		previousWatcher.close().catch((err: unknown) => {
			const message = err instanceof Error ? err.message : String(err);
			// biome-ignore lint/suspicious/noConsole: watcher errors must be logged
			console.error(
				`[ArkEnv Watcher] Failed to close previous watcher: ${message}`,
			);
		});
	}

	try {
		const watcher = chokidarWatch(schemaPath, { ignoreInitial: true });
		globalThis.__arkenv_watcher__ = watcher;

		watcher.on("change", () => {
			try {
				const mainSchemaPath = Array.isArray(schemaPath)
					? schemaPath[0]
					: schemaPath;
				runCodegen(mainSchemaPath, outputPath, layout);
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				// biome-ignore lint/suspicious/noConsole: watcher errors must be logged
				console.error(
					`[ArkEnv Watcher] Failed to regenerate env.gen.ts: ${message}`,
				);
			}
		});
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		// biome-ignore lint/suspicious/noConsole: watcher errors must be logged
		console.error(
			`[ArkEnv Watcher] Failed to start watch on ${schemaPath}: ${message}`,
		);
	}
}

/**
 * Run code generation to read the schema file and generate the env.gen.ts factory.
 *
 * @param schemaPath The absolute path to the schema file or directory
 * @param outputPath The absolute path to the generated output file
 * @param layoutOption The explicit layout to use; auto-detected from the filesystem when omitted
 * @throws An error if strict layout files are missing when `layoutOption` is `"strict"`
 */
export function runCodegen(
	schemaPath: string,
	outputPath: string,
	layoutOption?: "simple" | "strict",
) {
	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		layoutOption,
	);

	let generatedCode = "";
	if (resolvedLayout === "strict") {
		const clientPath = path.join(baseDir, "client.ts");
		const sharedPath = path.join(baseDir, "internal", "shared.ts");

		const clientContent = fs.existsSync(clientPath)
			? fs.readFileSync(clientPath, "utf-8")
			: "";
		const sharedContent = fs.existsSync(sharedPath)
			? fs.readFileSync(sharedPath, "utf-8")
			: "";

		const clientKeys = extractClientKeys(clientContent);
		const sharedKeys = extractSharedKeys(sharedContent);

		generatedCode = generateClientFactoryCode(clientKeys, sharedKeys);
	} else {
		const fileContent = fs.readFileSync(schemaPath, "utf-8");
		const { clientKeys, sharedKeys } = extractKeys(fileContent);
		generatedCode = generateFactoryCode(clientKeys, sharedKeys);
	}

	// Ensure parent directory exists
	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Write if changed to avoid unnecessary filesystem/watcher triggers
	let shouldWrite = true;
	if (fs.existsSync(outputPath)) {
		const existingContent = fs.readFileSync(outputPath, "utf-8");
		if (existingContent === generatedCode) {
			shouldWrite = false;
		}
	}

	if (shouldWrite) {
		fs.writeFileSync(outputPath, generatedCode, "utf-8");
	}
}

/**
 * Statically extract client and shared keys from the schema content.
 *
 * @param content The schema file string content
 * @returns An object containing the extracted client and shared keys
 */
export function extractKeys(content: string): {
	clientKeys: string[];
	sharedKeys: string[];
} {
	const clientKeys: string[] = [];
	const sharedKeys: string[] = [];

	// Extract client block
	const clientBlock = extractBlock(content, "client");
	if (clientBlock) {
		clientKeys.push(...parseBlockKeys(clientBlock));
	}

	// Extract shared block
	const sharedBlock = extractBlock(content, "shared");
	if (sharedBlock) {
		sharedKeys.push(...parseBlockKeys(sharedBlock));
	}

	return { clientKeys, sharedKeys };
}

/**
 * Extract a specific block from the schema content by name.
 *
 * @param content The schema file string content
 * @param blockName The name of the block to extract (e.g., 'client' or 'shared')
 * @returns The contents of the block, or null if not found
 */
function extractBlock(content: string, blockName: string): string | null {
	// Find "\bblockName\s*:\s*{" or "\bblockName\s*:\s*type({"
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
 * Parse environment variable keys from a block's content.
 *
 * @param blockContent The raw content of the block
 * @returns An array of parsed environment variable keys
 */
function parseBlockKeys(blockContent: string): string[] {
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

		// Start comments/strings
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
 * Generate the TypeScript factory code for the tailored arkenv helper.
 *
 * @param clientKeys The client environment variable keys
 * @param sharedKeys The shared environment variable keys
 * @returns The generated TypeScript source code string
 */
function generateFactoryCode(
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const allKeys = Array.from(new Set([...clientKeys, ...sharedKeys]));
	const runtimeEnvLines = allKeys
		.map((key) => `\t\t\t${key}: process.env.${key},`)
		.join("\n");

	return `/* eslint-disable */
// prettier-ignore
// biome-ignore format: auto-generated
/**
 * @file env.gen.ts
 * @note This file is auto-generated by ArkEnv. DO NOT EDIT DIRECTLY.
 * @see https://arkenv.js.org
 */

import { arkenv as coreArkenv } from "@arkenv/nextjs";
import type { Infer } from "@arkenv/nextjs";

export { type } from "@arkenv/nextjs";

export function arkenv<
	const TServer extends Record<string, any> = {},
	const TClient extends Record<string, any> = {},
	const TShared extends Record<string, any> = {},
>(options: {
	server?: TServer;
	client?: TClient & {
		[K in keyof TClient]: K extends \`NEXT_PUBLIC_\${string}\` ? unknown : never;
	};
	shared?: TShared;
}): Readonly<Infer<TServer & TClient & TShared>> {
	return coreArkenv({
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any) as any;
}

export default arkenv;
`;
}

/**
 * Generate the TypeScript factory code for the strict-layout `arkenv` helper.
 *
 * Unlike `generateFactoryCode`, this variant imports from `@arkenv/nextjs/client`
 * and exposes a positional-schema signature suited for split-file projects.
 *
 * @param clientKeys The env var keys extracted from `client.ts`
 * @param sharedKeys The env var keys extracted from `internal/shared.ts`
 * @returns The generated TypeScript source code string
 */
function generateClientFactoryCode(
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const allKeys = Array.from(new Set([...clientKeys, ...sharedKeys]));
	const runtimeEnvLines = allKeys
		.map((key) => `\t\t\t${key}: process.env.${key},`)
		.join("\n");

	return `/* eslint-disable */
// prettier-ignore
// biome-ignore format: auto-generated
/**
 * @file env.gen.ts
 * @note This file is auto-generated by ArkEnv. DO NOT EDIT DIRECTLY.
 * @see https://arkenv.js.org
 */

import { arkenv as coreArkenv } from "@arkenv/nextjs/client";

export { type } from "@arkenv/nextjs/client";

export function arkenv<
	const TSchema extends Record<string, any> = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema & {
		[K in keyof TSchema]: K extends \`NEXT_PUBLIC_\${string}\` ? unknown : never;
	},
	options?: {
		extends?: [...TExtends];
	},
) {
	return coreArkenv<TSchema, TExtends>(schema as any, {
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any);
}

export default arkenv;
`;
}

/**
 * Extract env var keys from a strict-layout `client.ts` file.
 *
 * Locates the first `arkenv({...})` call and delegates to `parseBlockKeys`
 * to enumerate the keys defined in the schema object.
 *
 * @param content The source text of `client.ts`
 * @returns An array of env var key names found in the client schema
 */
export function extractClientKeys(content: string): string[] {
	const block = extractClientBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract env var keys from a strict-layout `internal/shared.ts` file.
 *
 * Locates the `SharedSchema = ...({...})` assignment and delegates to
 * `parseBlockKeys` to enumerate the keys defined in the schema object.
 *
 * @param content The source text of `internal/shared.ts`
 * @returns An array of env var key names found in the shared schema
 */
export function extractSharedKeys(content: string): string[] {
	const block = extractSharedBlock(content);
	return block ? parseBlockKeys(block) : [];
}

/**
 * Extract the schema object body from a strict-layout `client.ts` file.
 *
 * Matches the first `arkenv(...)` call, then performs brace-balanced
 * traversal while respecting strings and comments to find the boundaries
 * of the first argument object.
 *
 * @param content The source text of `client.ts`
 * @returns The raw text inside the first `{...}` argument, or `null` if not found
 */
function extractClientBlock(content: string): string | null {
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
 * Extract the schema object body from a strict-layout `internal/shared.ts` file.
 *
 * Matches the `SharedSchema = ...({...})` assignment, then performs
 * brace-balanced traversal while respecting strings and comments to find
 * the boundaries of the schema object.
 *
 * @param content The source text of `internal/shared.ts`
 * @returns The raw text inside the `{...}` schema object, or `null` if not found
 */
function extractSharedBlock(content: string): string | null {
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
