import fs from "node:fs";
import path from "node:path";
import { watch as chokidarWatch } from "chokidar";

declare global {
	// eslint-disable-next-line no-var
	var __arkenv_nuxt_watcher__: import("chokidar").FSWatcher | undefined;
}

export type ArkEnvConfigOptions = {
	schemaPath?: string;
	outputPath?: string;
	layout?: "simple" | "strict";
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
	layoutOption?: "simple" | "strict",
): { layout: "simple" | "strict"; baseDir: string } {
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
 * Watch the schema file(s) for changes and automatically run codegen to update output.
 *
 * @param schemaPath The absolute path or list of paths of schema files to watch
 * @param outputPath The absolute path where the generated code should be written
 * @param layout The layout option to pass to codegen
 */
export function watchSchema(
	schemaPath: string | string[],
	outputPath: string,
	layout?: "simple" | "strict",
) {
	const previousWatcher = globalThis.__arkenv_nuxt_watcher__;

	const startWatch = () => {
		try {
			const watcher = chokidarWatch(schemaPath, { ignoreInitial: true });
			globalThis.__arkenv_nuxt_watcher__ = watcher;

			watcher.on("change", () => {
				try {
					const mainSchemaPath = Array.isArray(schemaPath)
						? schemaPath[0]
						: schemaPath;
					runCodegen(mainSchemaPath, outputPath, layout);
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					console.error(
						`[ArkEnv Watcher] Failed to regenerate env.gen.ts: ${message}`,
					);
				}
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			console.error(
				`[ArkEnv Watcher] Failed to start watch on ${schemaPath}: ${message}`,
			);
		}
	};

	if (previousWatcher && typeof previousWatcher.close === "function") {
		previousWatcher
			.close()
			.catch((err: unknown) => {
				const message = err instanceof Error ? err.message : String(err);
				console.error(
					`[ArkEnv Watcher] Failed to close previous watcher: ${message}`,
				);
			})
			.finally(() => {
				startWatch();
			});
	} else {
		startWatch();
	}
}

/**
 * Run code generation to read the schema file and generate the env.gen.ts helper.
 *
 * @param schemaPath The absolute path to the schema file or directory
 * @param outputPath The absolute path to the generated output file
 * @param layoutOption The explicit layout configuration option
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
		const serverPath = path.join(baseDir, "server.ts");

		const clientContent = fs.existsSync(clientPath)
			? fs.readFileSync(clientPath, "utf-8")
			: "";
		const sharedContent = fs.existsSync(sharedPath)
			? fs.readFileSync(sharedPath, "utf-8")
			: "";
		const serverContent = fs.existsSync(serverPath)
			? fs.readFileSync(serverPath, "utf-8")
			: "";

		const clientKeys = extractClientKeys(clientContent);
		const sharedKeys = extractSharedKeys(sharedContent);
		const serverKeys = extractServerKeys(serverContent);

		generatedCode = generateClientFactoryCode(
			serverKeys,
			clientKeys,
			sharedKeys,
		);
	} else {
		const fileContent = fs.readFileSync(schemaPath, "utf-8");
		const { serverKeys, clientKeys, sharedKeys } = extractKeys(fileContent);
		generatedCode = generateFactoryCode(serverKeys, clientKeys, sharedKeys);
	}

	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

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
 * Extract environment variable keys statically from the schema file content.
 *
 * @param content The string content of the schema file
 * @returns An object containing arrays of server, client, and shared keys
 */
export function extractKeys(content: string): {
	serverKeys: string[];
	clientKeys: string[];
	sharedKeys: string[];
} {
	const serverKeys: string[] = [];
	const clientKeys: string[] = [];
	const sharedKeys: string[] = [];

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

	return { serverKeys, clientKeys, sharedKeys };
}

/**
 * Extract the body of a specific block (e.g. 'server', 'client', or 'shared') from the schema content.
 *
 * @param content The string content of the schema file
 * @param blockName The name of the block to extract
 * @returns The body of the block as a string, or null if not found
 */
function extractBlock(content: string, blockName: string): string | null {
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

/**
 * Generate the code for the client/server factory file (`env.gen.ts`) in simple layout mode.
 *
 * @param serverKeys The server environment variable keys
 * @param clientKeys The client environment variable keys
 * @param sharedKeys The shared environment variable keys
 * @returns The generated TypeScript code as a string
 */
function generateFactoryCode(
	serverKeys: string[],
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const serverEnvLines = serverKeys
		.map((key) => `\t\t\t\t${key}: config?.${key} ?? process.env.${key},`)
		.join("\n");
	const clientSharedEnvLines = Array.from(
		new Set([...clientKeys, ...sharedKeys]),
	)
		.map((key) => `\t\t\t${key}: config?.public?.${key} ?? process.env.${key},`)
		.join("\n");

	const serverGuard =
		serverKeys.length > 0
			? `\t\t\t...(isServer ? {\n${serverEnvLines}\n\t\t\t} : {}),`
			: "";

	const runtimeEnvLines = [clientSharedEnvLines, serverGuard]
		.filter(Boolean)
		.join("\n");

	return `/* eslint-disable */
// prettier-ignore
// biome-ignore format: auto-generated
/**
 * @file env.gen.ts
 * @note This file is auto-generated by ArkEnv. DO NOT EDIT DIRECTLY.
 * @see https://arkenv.js.org
 */

import { createEnv as coreCreateEnv } from "@arkenv/nuxt";
import type { Infer } from "@arkenv/nuxt";
// @ts-ignore
import { useRuntimeConfig } from "#imports";

export { type } from "@arkenv/nuxt";

function getRuntimeConfig() {
	try {
		return useRuntimeConfig();
	} catch {
		return null;
	}
}

export function createEnv<
	const TServer extends Record<string, any> = {},
	const TClient extends Record<string, any> = {},
	const TShared extends Record<string, any> = {},
>(options: {
	server?: TServer;
	client?: TClient & {
		[K in keyof TClient]: K extends \`NUXT_PUBLIC_\${string}\` ? unknown : never;
	};
	shared?: TShared;
}): Readonly<Infer<TServer & TClient & TShared>> {
	const config = getRuntimeConfig();
	const isServer = typeof window === "undefined";
	return coreCreateEnv({
		...options,
		server: isServer ? options.server : undefined,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any) as any;
}

const arkenv = createEnv;
export default arkenv;
`;
}

/**
 * Generate the code for the client-side factory file (`env.gen.ts`) in strict layout mode.
 *
 * @param serverKeys The server environment variable keys
 * @param clientKeys The client environment variable keys
 * @param sharedKeys The shared environment variable keys
 * @returns The generated TypeScript code as a string
 */
function generateClientFactoryCode(
	serverKeys: string[],
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const clientSharedEnvLines = Array.from(
		new Set([...clientKeys, ...sharedKeys]),
	)
		.map((key) => `\t\t\t${key}: config?.public?.${key} ?? process.env.${key},`)
		.join("\n");

	return `/* eslint-disable */
// prettier-ignore
// biome-ignore format: auto-generated
/**
 * @file env.gen.ts
 * @note This file is auto-generated by ArkEnv. DO NOT EDIT DIRECTLY.
 * @see https://arkenv.js.org
 */

import { createEnv as coreCreateEnv } from "@arkenv/nuxt/client";
// @ts-ignore
import { useRuntimeConfig } from "#imports";

export { type } from "@arkenv/nuxt/client";

function getRuntimeConfig() {
	try {
		return useRuntimeConfig();
	} catch {
		return null;
	}
}

export function createEnv<
	const TSchema extends Record<string, any> = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema & {
		[K in keyof TSchema]: K extends \`NUXT_PUBLIC_\${string}\` ? unknown : never;
	},
	options?: {
		extends?: [...TExtends];
	},
) {
	const config = getRuntimeConfig();
	return coreCreateEnv<TSchema, TExtends>(schema as any, {
		...options,
		runtimeEnv: {
${clientSharedEnvLines}
		},
	} as any);
}

const arkenv = createEnv;
export default arkenv;
`;
}
