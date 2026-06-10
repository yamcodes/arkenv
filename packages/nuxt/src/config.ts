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

export function watchSchema(
	schemaPath: string | string[],
	outputPath: string,
	layout?: "simple" | "strict",
) {
	const previousWatcher = globalThis.__arkenv_nuxt_watcher__;
	if (previousWatcher && typeof previousWatcher.close === "function") {
		previousWatcher.close().catch((err: unknown) => {
			const message = err instanceof Error ? err.message : String(err);
			console.error(
				`[ArkEnv Watcher] Failed to close previous watcher: ${message}`,
			);
		});
	}

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
}

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

export function extractClientKeys(content: string): string[] {
	const block = extractArkenvBlock(content);
	return block ? parseBlockKeys(block) : [];
}

export function extractServerKeys(content: string): string[] {
	const block = extractArkenvBlock(content);
	return block ? parseBlockKeys(block) : [];
}

export function extractSharedKeys(content: string): string[] {
	const block = extractSharedBlock(content);
	return block ? parseBlockKeys(block) : [];
}

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

function generateFactoryCode(
	serverKeys: string[],
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const serverEnvLines = serverKeys
		.map((key) => `\t\t\t${key}: config?.${key} ?? process.env.${key},`)
		.join("\n");
	const clientSharedEnvLines = Array.from(
		new Set([...clientKeys, ...sharedKeys]),
	)
		.map((key) => `\t\t\t${key}: config?.public?.${key} ?? process.env.${key},`)
		.join("\n");

	const allLines = [serverEnvLines, clientSharedEnvLines]
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
	return coreCreateEnv({
		...options,
		runtimeEnv: {
${allLines}
		},
	} as any) as any;
}

const arkenv = createEnv;
export default arkenv;
`;
}

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
