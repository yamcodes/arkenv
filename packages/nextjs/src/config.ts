import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	extractKeys as coreExtractKeys,
	extractClientKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
	watchSchema,
} from "@arkenv/build";
import { createJiti } from "jiti";

export { extractClientKeys, extractSharedKeys };

let hasWarnedSimpleLayout = false;

function normalizeLayout(
	layout: ArkEnvConfigOptions["layout"],
): "simple" | "strict" | undefined {
	if (layout === "simple") {
		if (process.env.NODE_ENV === "development" && !hasWarnedSimpleLayout) {
			hasWarnedSimpleLayout = true;
			console.warn(
				"⚠️ [arkenv] The 'simple' layout option is deprecated and will be removed in the next major version. Use 'flat' instead.",
			);
		}
		return "simple";
	}
	if (layout === "flat") {
		return "simple";
	}
	return layout;
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
	 * - `"flat"` (default): A single `env.ts` schema file.
	 * - `"strict"`: A 3-file split schema layout (`env/internal/shared.ts`, `env/client.ts`, `env/server.ts`).
	 *
	 * @default "flat"
	 */
	layout?:
		| "flat"
		| "strict"
		/** @deprecated Use `"flat"` instead. `"simple"` will be removed in the next major version. */
		| "simple";

	/**
	 * Enable or disable build-time environment variable validation during build/dev startup.
	 *
	 * @default true
	 */
	validate?: boolean;

	/**
	 * Enable or disable automatic code generation of the `env.gen.ts` file.
	 *
	 * @default true
	 */
	codegen?: boolean;
};

/**
 * Run ArkEnv codegen and setup without wrapping nextConfig.
 *
 * @param options Optional configuration paths for schema and output files
 * @param internalOptions Optional configuration for internal testing hooks
 * @throws An error if the schema file cannot be found or if code generation fails
 */
export function setupArkEnv(
	options?: ArkEnvConfigOptions,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
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
			}. Please specify 'schemaPath' in setupArkEnv options (or run \`arkenv init\`).`,
		);
	}

	const normalizedLayout = normalizeLayout(options?.layout);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
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

	// 3. Run initial code generation if enabled
	const codegen = options?.codegen ?? true;
	if (codegen) {
		try {
			runCodegen(schemaPath, outputPath, resolvedLayout);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`[ArkEnv] Failed to generate env.gen.ts: ${message}`);
		}
	}

	// 4. Validate schema against environment variables
	const runValidation = options?.validate ?? true;
	if (runValidation) {
		try {
			(globalThis as any).__arkenv_force_server__ = true;
			const fileToEvaluate =
				resolvedLayout === "strict" && baseDir
					? path.join(baseDir, "server.ts")
					: schemaPath;

			const filenameForJiti =
				typeof __filename !== "undefined"
					? __filename
					: typeof import.meta !== "undefined" && import.meta.url
						? fileURLToPath(import.meta.url)
						: "";
			const dir = path.dirname(filenameForJiti);
			const sharedPath = fs.existsSync(path.join(dir, "shared.ts"))
				? path.join(dir, "shared.ts")
				: path.join(dir, "shared.js");

			const aliases: Record<string, string> = {
				"server-only": sharedPath,
				"./script": sharedPath,
				"./script.tsx": sharedPath,
				...internalOptions?._jitiAliases,
			};

			const jiti = createJiti(fileToEvaluate, {
				moduleCache: false,
				fsCache: false,
				tsconfigPaths: true,
				alias: aliases,
			});
			jiti(fileToEvaluate);
		} catch (error: unknown) {
			console.error("\n❌ [ArkEnv] Environment validation failed:");
			console.error(error instanceof Error ? error.message : String(error));
			console.error("");
			process.exit(1);
		} finally {
			delete (globalThis as any).__arkenv_force_server__;
		}
	}

	// 5. Initialize development file watcher if in dev mode and codegen is enabled
	const isDev =
		process.env.NODE_ENV === "development" ||
		process.env.NEXT_PHASE === "phase-development-server";
	if (isDev && codegen) {
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
	layoutOption?: ArkEnvConfigOptions["layout"],
) {
	const normalizedLayout = normalizeLayout(layoutOption);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
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

/**
 * Statically extract client and shared keys from the schema content using NEXT_PUBLIC_ prefix.
 *
 * @param content The schema file string content
 * @returns An object containing the extracted client and shared keys
 */
export function extractKeys(content: string): {
	clientKeys: string[];
	sharedKeys: string[];
	serverKeys: string[];
	isLegacy?: boolean;
} {
	return coreExtractKeys(content, "NEXT_PUBLIC_");
}

/**
 * Generate the triple-tab indented runtime environment variables mapping.
 */
function generateRuntimeEnvLines(
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const allKeys = Array.from(new Set([...clientKeys, ...sharedKeys]));
	return allKeys
		.map(
			(key) =>
				`\t\t\t${key}: typeof window !== "undefined" ? (globalThis as any).__arkenv_env__?.${key} ?? process.env.${key} : process.env.${key},`,
		)
		.join("\n");
}

const GENERATED_HEADER = `/* eslint-disable */
// biome-ignore format: auto-generated
// Generated by ArkEnv. DO NOT EDIT DIRECTLY.
`;

const GENERATED_FOOTER = `
export default createEnv;
`;

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
	const runtimeEnvLines = generateRuntimeEnvLines(clientKeys, sharedKeys);

	return `${GENERATED_HEADER}
import { createEnv as coreCreateEnv } from "@arkenv/nextjs";

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
}) {
	return coreCreateEnv({
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any) as any;
}
${GENERATED_FOOTER}`;
}

/**
 * Generate the TypeScript factory code for the Flat Layout createEnv helper.
 *
 * @remarks
 * **Architecture tripwire:** Do not statically compile the schema here or
 * reference internal-only types (the `$` scope or `MergeExtends`).
 *
 * - **Generic wrapper:** The factory must stay generic because the concrete
 *   schema is owned by the user-land `env.ts`.
 * - **Type strategy:** It intentionally returns the full schema type to ensure
 *   flawless Server Component autocomplete.
 * - **Security boundary:** Client-side protection is deliberately deferred to
 *   the runtime Proxy in `@arkenv/nextjs`, which throws on unauthorized access.
 *
 * 📖 See ADR-0010: Flat layout codegen and type inference strategy
 * (`docs/adr/0010-flat-layout-codegen-type-strategy.md`).
 */
function generateFlatFactoryCode(
	clientKeys: string[],
	sharedKeys: string[],
): string {
	const runtimeEnvLines = generateRuntimeEnvLines(clientKeys, sharedKeys);

	return `${GENERATED_HEADER}
import { createEnv as coreCreateEnv } from "@arkenv/nextjs";
import type { type as at, distill } from "arktype";

export { type } from "@arkenv/nextjs";

export function createEnv<
	const TSchema extends Record<string, unknown> & { runtimeEnv?: never } = {},
	const TExpose extends keyof TSchema = never,
	const TExtends extends readonly unknown[] = [],
>(
	schema: TSchema,
	options?: {
		/**
		 * Custom environment variables to expose to the client bundle.
		 * By default, variables prefixed with \`NEXT_PUBLIC_\` and \`NODE_ENV\` are exposed automatically.
		 * Use this option to expose custom variables that do not have the \`NEXT_PUBLIC_\` prefix.
		 */
		exposeToClient?: readonly TExpose[];
		extends?: [...TExtends];
	},
): Readonly<distill.Out<at.infer<TSchema>>> {
	// Types expose the full schema for a great DX on the server; the runtime
	// Proxy from \`@arkenv/nextjs\` enforces the security boundary by throwing
	// when a server-only variable is accessed on the client.
	const env = coreCreateEnv(schema as any, {
		...options,
		runtimeEnv: {
${runtimeEnvLines}
		},
	} as any);
	return env as unknown as Readonly<distill.Out<at.infer<TSchema>>>;
}
${GENERATED_FOOTER}`;
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
	const runtimeEnvLines = generateRuntimeEnvLines(clientKeys, sharedKeys);

	return `${GENERATED_HEADER}
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
${GENERATED_FOOTER}`;
}
