import fs from "node:fs";
import path from "node:path";
import { watch as chokidarWatch } from "chokidar";

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

	// 2. Determine outputPath (defaults to generated/env.gen.ts in the same directory as schemaPath)
	const defaultOutputDir = path.dirname(schemaPath);
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
		chokidarWatch(schemaPath, { ignoreInitial: true }).on("change", () => {
			try {
				runCodegen(schemaPath, outputPath);
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

	return `/* eslint-disable */
// prettier-ignore
// biome-ignore format: auto-generated
/**
 * @file env.gen.ts
 * @note This file is auto-generated by ArkEnv. DO NOT EDIT DIRECTLY.
 * @see https://arkenv.js.org
 */

import { createEnv as coreCreateEnv } from "@arkenv/nextjs";
import type { Infer } from "@arkenv/nextjs";

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
}): Readonly<Infer<TServer & TClient & TShared>> {
	return coreCreateEnv({
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any) as any;
}
`;
}
