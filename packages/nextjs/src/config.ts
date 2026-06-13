import fs from "node:fs";
import path from "node:path";
import {
	extractClientKeys,
	extractKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
	watchSchema,
} from "@arkenv/build";

// Re-export key extraction utilities for backwards compatibility and testing
export {
	extractClientKeys,
	extractKeys,
	extractSharedKeys,
} from "@arkenv/build";

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
		watchSchema(watchPaths, () => {
			const mainSchemaPath = Array.isArray(watchPaths)
				? watchPaths[0]
				: watchPaths;
			runCodegen(mainSchemaPath, outputPath, resolvedLayout);
		});
	}

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
