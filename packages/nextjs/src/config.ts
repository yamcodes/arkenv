import fs from "node:fs";
import path from "node:path";
import {
	extractBlock,
	extractClientKeys,
	extractSharedKeys,
	findSchemaPath,
	parseBlockKeys,
	resolveLayout,
	watchSchema,
} from "@arkenv/build";

export { extractClientKeys, extractSharedKeys };

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
 * Run ArkEnv codegen and setup without wrapping nextConfig.
 *
 * @param options Optional configuration paths for schema and output files
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function setupArkEnv(options?: ArkEnvConfigOptions): void {
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
			}. Please specify 'schemaPath' in setupArkEnv options.`,
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
		watchSchema(watchPaths, () => {
			runCodegen(schemaPath, outputPath, resolvedLayout);
		});
	}
}

/**
 * Wrap a Next.js configuration object to automatically generate the `runtimeEnv` block in `env.gen.ts`.
 *
 * @param nextConfig The Next.js configuration object or function
 * @param options Optional configuration paths for schema and output files
 * @returns The Next.js configuration object unchanged
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function withArkEnv<T>(nextConfig: T, options?: ArkEnvConfigOptions): T {
	setupArkEnv(options);
	return nextConfig;
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
		const { clientKeys, sharedKeys, isLegacy } = extractKeys(fileContent);
		if (isLegacy) {
			generatedCode = generateFactoryCode(clientKeys, sharedKeys);
		} else {
			generatedCode = generateFlatFactoryCode(clientKeys, sharedKeys);
		}
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

function extractCallArguments(
	content: string,
): { schemaArg: string; optionsArg: string | null } | null {
	const regex = /\b(?:arkenv|createEnv)\s*\(/g;
	while (regex.exec(content) !== null) {
		let parenCount = 1;
		let index = regex.lastIndex;
		let inString: string | null = null;
		let inComment: "single" | "multi" | null = null;
		let braceCount = 0;
		let bracketCount = 0;

		const args: string[] = [];
		let currentArg = "";

		while (index < content.length && parenCount > 0) {
			const char = content[index];
			const nextChar = content[index + 1];

			if (inComment === "single") {
				if (char === "\n" || char === "\r") inComment = null;
				currentArg += char;
				index++;
				continue;
			}
			if (inComment === "multi") {
				if (char === "*" && nextChar === "/") {
					inComment = null;
					currentArg += "*/";
					index += 2;
					continue;
				}
				currentArg += char;
				index++;
				continue;
			}

			if (inString) {
				if (char === inString && content[index - 1] !== "\\") {
					inString = null;
				}
				currentArg += char;
				index++;
				continue;
			}

			if (char === "/" && nextChar === "/") {
				inComment = "single";
				currentArg += "//";
				index += 2;
				continue;
			}
			if (char === "/" && nextChar === "*") {
				inComment = "multi";
				currentArg += "/*";
				index += 2;
				continue;
			}
			if (char === "'" || char === '"' || char === "`") {
				inString = char;
				currentArg += char;
				index++;
				continue;
			}

			if (char === "(") {
				parenCount++;
			} else if (char === ")") {
				parenCount--;
			} else if (char === "{") {
				braceCount++;
			} else if (char === "}") {
				braceCount--;
			} else if (char === "[") {
				bracketCount++;
			} else if (char === "]") {
				bracketCount--;
			}

			if (parenCount === 0) {
				args.push(currentArg);
				break;
			}

			if (
				char === "," &&
				parenCount === 1 &&
				braceCount === 0 &&
				bracketCount === 0
			) {
				args.push(currentArg);
				currentArg = "";
			} else {
				currentArg += char;
			}
			index++;
		}

		if (parenCount === 0 && args.length > 0) {
			return {
				schemaArg: args[0].trim(),
				optionsArg: args[1] ? args[1].trim() : null,
			};
		}
	}
	return null;
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
	isLegacy?: boolean;
} {
	const clientKeys: string[] = [];
	const sharedKeys: string[] = [];

	const args = extractCallArguments(content);
	if (!args) {
		return { clientKeys, sharedKeys, isLegacy: false };
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
	} else {
		// New flat layout
		const optionSharedKeys: string[] = [];
		if (args.optionsArg) {
			const sharedMatch = args.optionsArg.match(/shared\s*:\s*\[([\s\S]*?)\]/);
			if (sharedMatch) {
				const arrayContent = sharedMatch[1];
				const stringRegex =
					/(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`)/g;
				let match;
				while ((match = stringRegex.exec(arrayContent)) !== null) {
					const val = match[1] || match[2] || match[3];
					if (val) {
						optionSharedKeys.push(val);
					}
				}
			}
		}

		for (const key of topKeys) {
			if (optionSharedKeys.includes(key)) {
				sharedKeys.push(key);
			} else if (key.startsWith("NEXT_PUBLIC_")) {
				clientKeys.push(key);
			}
		}
	}

	return { clientKeys, sharedKeys, isLegacy };
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
		.map(
			(key) =>
				`\t\t\t${key}: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.${key} ?? process.env.${key} : process.env.${key},`,
		)
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

const arkenv = createEnv;
export default arkenv;
`;
}

/**
 * Generate the TypeScript factory code for the Flat Layout createEnv helper.
 */
function generateFlatFactoryCode(
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const allKeys = Array.from(new Set([...clientKeys, ...sharedKeys]));
	const runtimeEnvLines = allKeys
		.map(
			(key) =>
				`\t\t\t${key}: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.${key} ?? process.env.${key} : process.env.${key},`,
		)
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
	const TSchema extends Record<string, any> = {},
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema,
	options?: {
		shared?: readonly (keyof TSchema)[];
		extends?: [...TExtends];
	},
): Readonly<Infer<TSchema>> {
	const parsedEnv = coreCreateEnv(schema as any, {
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any) as any;

	return new Proxy(parsedEnv, {
		get(target, prop, receiver) {
			if (typeof prop === "string") {
				const isSchemaKey = prop in schema;
				const isServer = typeof window === "undefined";
				const isClientVar = prop.startsWith("NEXT_PUBLIC_");
				const isSharedVar = options?.shared?.includes(prop);

				if (isSchemaKey && !isServer && !isClientVar && !isSharedVar) {
					throw new Error(
						\`Accessing server-side environment variable '\${prop}' on the client is not allowed.\`
					);
				}
			}
			return Reflect.get(target, prop, receiver);
		}
	}) as any;
}

const arkenv = createEnv;
export default arkenv;
`;
}

/**
 * Generate the TypeScript factory code for the strict-layout `createEnv` helper.
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
		.map(
			(key) =>
				`\t\t\t${key}: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.${key} ?? process.env.${key} : process.env.${key},`,
		)
		.join("\n");

	return `/* eslint-disable */
// prettier-ignore
// biome-ignore format: auto-generated
/**
 * @file env.gen.ts
 * @note This file is auto-generated by ArkEnv. DO NOT EDIT DIRECTLY.
 * @see https://arkenv.js.org
 */

import { createEnv as coreCreateEnv } from "@arkenv/nextjs/client";

export { type } from "@arkenv/nextjs/client";

export function createEnv<
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
	return coreCreateEnv<TSchema, TExtends>(schema as any, {
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any);
}

const arkenv = createEnv;
export default arkenv;
`;
}
