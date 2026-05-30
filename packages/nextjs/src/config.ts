import fs from "node:fs";
import path from "node:path";

export type ArkEnvConfigOptions = {
	schemaPath?: string;
	outputPath?: string;
};

let watcherInitialized = false;

/**
 * Wrap a Next.js configuration object to automatically generate the `runtimeEnv` block in `env.gen.ts`.
 *
 * @param nextConfig The Next.js configuration object or function
 * @param options Optional configuration paths for schema and output files
 * @returns The Next.js configuration object unchanged
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function withArkEnv<T>(nextConfig: T, options?: ArkEnvConfigOptions): T {
	// 1. Locate the env.ts schema file
	const schemaPath = options?.schemaPath
		? path.resolve(options.schemaPath)
		: findSchemaPath();
	if (!schemaPath || !fs.existsSync(schemaPath)) {
		throw new Error(
			`[ArkEnv] Could not find schema file at ${
				options?.schemaPath || "src/env.ts or env.ts"
			}. Please specify 'schemaPath' in withArkEnv options.`,
		);
	}

	// 2. Determine outputPath (defaults to env.gen.ts in the same directory as schemaPath)
	const defaultOutputDir = path.dirname(schemaPath);
	const defaultOutputPath = path.join(defaultOutputDir, "env.gen.ts");
	const outputPath = options?.outputPath
		? path.resolve(options.outputPath)
		: defaultOutputPath;

	// 3. Run initial code generation
	try {
		runCodegen(schemaPath, outputPath);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`[ArkEnv] Failed to generate env.gen.ts: ${message}`);
	}

	// 4. Initialize development file watcher if in dev mode
	// Note: We check process.env.NODE_ENV or standard Next dev runtime markers
	const isDev =
		process.env.NODE_ENV === "development" ||
		process.env.NEXT_PHASE === "phase-development-server";
	if (isDev) {
		watchSchema(schemaPath, outputPath);
	}

	return nextConfig;
}

/**
 * Find the path to the schema file in the project.
 *
 * @returns The absolute path to the schema file, or null if not found
 */
function findSchemaPath(): string | null {
	const possiblePaths = [
		path.join(process.cwd(), "src", "env.ts"),
		path.join(process.cwd(), "env.ts"),
	];
	for (const p of possiblePaths) {
		if (fs.existsSync(p)) return p;
	}
	return null;
}

/**
 * Watch the schema file for changes and trigger codegen.
 *
 * @param schemaPath The absolute path to the schema file
 * @param outputPath The absolute path to the generated output file
 */
function watchSchema(schemaPath: string, outputPath: string) {
	if (watcherInitialized) return;
	watcherInitialized = true;

	try {
		fs.watch(schemaPath, (eventType) => {
			if (eventType === "change") {
				try {
					runCodegen(schemaPath, outputPath);
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);
					// biome-ignore lint/suspicious/noConsole: watcher errors must be logged
					console.error(
						`[ArkEnv Watcher] Failed to regenerate env.gen.ts: ${message}`,
					);
				}
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
 * @param schemaPath The absolute path to the schema file
 * @param outputPath The absolute path to the generated output file
 */
export function runCodegen(schemaPath: string, outputPath: string) {
	const fileContent = fs.readFileSync(schemaPath, "utf-8");
	const { clientKeys, sharedKeys } = extractKeys(fileContent);

	const generatedCode = generateFactoryCode(clientKeys, sharedKeys);

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
	// Find "\bblockName\s*:\s*{"
	const regex = new RegExp(`\\b${blockName}\\s*:\\s*\\{`, "g");
	const match = regex.exec(content);
	if (!match) return null;

	const startIndex = regex.lastIndex;
	let braceCount = 1;
	let index = startIndex;

	while (index < content.length && braceCount > 0) {
		const char = content[index];
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

		if (char === ":") {
			const key = currentToken.trim() || lastStringContent.trim();
			if (key) {
				keys.push(key);
			}
			currentToken = "";
			lastStringContent = "";
			continue;
		}

		if (/[a-zA-Z0-9_$]/.test(char)) {
			currentToken += char;
		} else if (
			char === "," ||
			char === "{" ||
			char === "}" ||
			char === "\n" ||
			char === "\r"
		) {
			currentToken = "";
			lastStringContent = "";
		}
	}

	return keys;
}

/**
 * Generate the TypeScript factory code for the tailored createEnv helper.
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

	return `// @ts-nocheck
/* eslint-disable */
// prettier-ignore
// biome-ignore format: auto-generated
/**
 * @file env.gen.ts
 * @note This file is auto-generated by ArkEnv. DO NOT EDIT DIRECTLY.
 * @see https://arkenv.js.org
 */

import { createEnv as coreCreateEnv } from "@arkenv/nextjs";
import type { $ } from "@repo/scope";
import type { type as at, distill } from "arktype";

export { type } from "@arkenv/nextjs";

export function createEnv<
	const TServer extends Record<string, any> = {},
	const TClient extends Record<string, any> = {},
	const TShared extends Record<string, any> = {},
>(options: {
	server?: TServer;
	client?: TClient & {
		[K in keyof TClient]: K extends \`NEXT_PUBLIC_\${string}\` ? unknown : never;
	};
	shared?: TShared;
}): Readonly<distill.Out<at.infer<TServer & TClient & TShared, $>>> {
	return coreCreateEnv({
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any) as any;
}
`;
}
