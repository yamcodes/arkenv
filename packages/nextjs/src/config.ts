import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	extractBlock,
	extractClientKeys,
	extractSharedKeys,
	findSchemaPath,
	parseBlockKeys,
	resolveLayout,
	watchSchema,
} from "@arkenv/build";
import {
	formatBuildError,
	logBuildError,
	logBuildErrorBlankLine,
	logBuildErrorDetail,
	logBuildWarning,
} from "@repo/utils";
import { createJiti } from "jiti";

export { extractClientKeys, extractSharedKeys };

let hasWarnedSimpleLayout = false;

function normalizeLayout(
	layout: ArkEnvConfigOptions["layout"],
): "simple" | "strict" | undefined {
	if (layout === "simple") {
		if (process.env.NODE_ENV === "development" && !hasWarnedSimpleLayout) {
			hasWarnedSimpleLayout = true;
			logBuildWarning(
				"The 'simple' layout option is deprecated and will be removed in the next major version. Use 'flat' instead.",
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
	 * Force standard mode code generation.
	 *
	 * When `true`, the generated `env.gen.ts` imports from `@arkenv/nextjs/standard/*`
	 * instead of `@arkenv/nextjs/*`, ensuring the Standard Schema engine (`@arkenv/standard`)
	 * is used and `arktype` is never bundled. This is set automatically when importing from
	 * `@arkenv/nextjs/standard/config`, but can be toggled manually for custom setups.
	 *
	 * @default false
	 */
	standard?: boolean;

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
			formatBuildError(
				`Could not find schema file at ${
					options?.schemaPath || "src/env.ts or env.ts"
				}. Please specify 'schemaPath' in setupArkEnv options.`,
			),
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
			runCodegen(schemaPath, outputPath, resolvedLayout, options?.standard);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				formatBuildError(`Failed to generate env.gen.ts: ${message}`),
			);
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
			logBuildError("Environment validation failed:");
			logBuildErrorDetail(
				error instanceof Error ? error.message : String(error),
			);
			logBuildErrorBlankLine();
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
			runCodegen(schemaPath, outputPath, resolvedLayout, options?.standard);
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
 * @param forceStandard Force standard mode code generation
 * @throws An error if strict layout files are missing when `layoutOption` is `"strict"`
 */
export function runCodegen(
	schemaPath: string,
	outputPath: string,
	layoutOption?: ArkEnvConfigOptions["layout"],
	forceStandard?: boolean,
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

		const isStandard =
			!!forceStandard ||
			clientContent.includes("@arkenv/standard") ||
			clientContent.includes("arkenv/standard") ||
			sharedContent.includes("@arkenv/standard") ||
			sharedContent.includes("arkenv/standard");

		const clientKeys = extractClientKeys(clientContent);
		const sharedKeys = extractSharedKeys(sharedContent);

		generatedCode = generateClientFactoryCode(
			clientKeys,
			sharedKeys,
			isStandard,
		);
	} else {
		const fileContent = fs.readFileSync(schemaPath, "utf-8");
		const isStandard =
			!!forceStandard ||
			fileContent.includes("@arkenv/standard") ||
			fileContent.includes("arkenv/standard");

		const { clientKeys, sharedKeys, isLegacy } = extractKeys(fileContent);
		if (isLegacy) {
			generatedCode = generateFactoryCode(clientKeys, sharedKeys, isStandard);
		} else {
			generatedCode = generateFlatFactoryCode(
				clientKeys,
				sharedKeys,
				isStandard,
			);
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
			// NODE_ENV is implicitly shared as Next.js automatically inlines and replaces references to process.env.NODE_ENV in browser bundles.
			// See: https://nextjs.org/docs/app/guides/environment-variables
			if (optionExposedKeys.includes(key) || key === "NODE_ENV") {
				sharedKeys.push(key);
			} else if (key.startsWith("NEXT_PUBLIC_")) {
				clientKeys.push(key);
			}
		}
	}

	return { clientKeys, sharedKeys, isLegacy };
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
export default arkenv;
`;

/**
 * Generate the TypeScript factory code for the tailored arkenv helper.
 *
 * @param clientKeys The client environment variable keys
 * @param sharedKeys The shared environment variable keys
 * @param isStandard Whether standard mode is used
 * @returns The generated TypeScript source code string
 */
function generateFactoryCode(
	clientKeys: string[],
	sharedKeys: string[],
	isStandard?: boolean,
): string {
	const runtimeEnvLines = generateRuntimeEnvLines(clientKeys, sharedKeys);
	const importPath = isStandard ? "@arkenv/nextjs/standard" : "@arkenv/nextjs";
	const coreName = "arkenv";
	const typeExport = isStandard
		? ""
		: '\nexport { type } from "@arkenv/nextjs";\n';
	const callPrefix = "coreArkenv";

	return `${GENERATED_HEADER}
import { ${coreName} as coreArkenv } from "${importPath}";
${typeExport}
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
}) {
	return ${callPrefix}({
		...options,
		runtimeEnv: {
			${runtimeEnvLines}
		},
	} as any) as any;
}
${GENERATED_FOOTER}`;
}

/**
 * Generate the TypeScript factory code for the Flat Layout arkenv helper.
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
 * 📖 See ADR-0013: Flat layout codegen and type inference strategy
 * (`docs/adr/0013-flat-layout-codegen-type-strategy.md`).
 */
function generateFlatFactoryCode(
	clientKeys: string[],
	sharedKeys: string[],
	isStandard?: boolean,
): string {
	const runtimeEnvLines = generateRuntimeEnvLines(clientKeys, sharedKeys);
	const importPath = isStandard ? "@arkenv/nextjs/standard" : "@arkenv/nextjs";
	const coreName = "arkenv";
	const typeExport = isStandard
		? ""
		: '\nexport { type } from "@arkenv/nextjs";\n';
	const typeImport = isStandard
		? ""
		: '\nimport type { type as at, distill } from "arktype";';
	const returnType = isStandard
		? "Readonly<TSchema>"
		: "Readonly<distill.Out<at.infer<TSchema>>>";
	const castReturn = isStandard
		? ""
		: " as unknown as Readonly<distill.Out<at.infer<TSchema>>>";
	const callPrefix = "coreArkenv";

	return `${GENERATED_HEADER}
import { ${coreName} as coreArkenv } from "${importPath}";${typeImport}
${typeExport}
export function arkenv<
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
): ${returnType} {
	// Types expose the full schema for a great DX on the server; the runtime
	// Proxy from \`@arkenv/nextjs\` enforces the security boundary by throwing
	// when a server-only variable is accessed on the client.
	const env = ${callPrefix}(schema as any, {
		...options,
		runtimeEnv: {
			${runtimeEnvLines}
		},
	} as any);
	return env${castReturn};
}
${GENERATED_FOOTER}`;
}

/**
 * Generate the TypeScript factory code for the strict-layout `arkenv` helper.
 *
 * Unlike `generateFactoryCode`, this variant imports from `@arkenv/nextjs/client`
 * and exposes a positional-schema signature suited for split-file projects.
 *
 * @param clientKeys The env var keys extracted from `client.ts`
 * @param sharedKeys The env var keys extracted from `internal/shared.ts`
 * @param isStandard Whether standard mode is used
 * @returns The generated TypeScript source code string
 */
function generateClientFactoryCode(
	clientKeys: string[],
	sharedKeys: string[],
	isStandard?: boolean,
): string {
	const runtimeEnvLines = generateRuntimeEnvLines(clientKeys, sharedKeys);
	const importPath = isStandard
		? "@arkenv/nextjs/standard/client"
		: "@arkenv/nextjs/client";
	const coreName = "arkenv";
	const typeExport = isStandard
		? ""
		: '\nexport { type } from "@arkenv/nextjs/client";\n';
	const typeImport = isStandard
		? ""
		: '\nimport type { Infer } from "@arkenv/core";';
	const callPrefix = "coreArkenv";
	const returnType = isStandard
		? "Readonly<TSchema & MergeExtends<TExtends>>"
		: "Readonly<Infer<TSchema> & MergeExtends<TExtends>>";

	return `${GENERATED_HEADER}
import { ${coreName} as coreArkenv } from "${importPath}";${typeImport}
${typeExport}
type ResolveExtend<T> = [Infer<T>] extends [never] ? T : Infer<T>;

type UnionToIntersection<U> = (
	U extends any ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never;

type MergeExtends<TExtends extends readonly unknown[] | undefined> =
	TExtends extends readonly unknown[]
		? UnionToIntersection<ResolveExtend<TExtends[number]>>
		: {};

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
): ${returnType} {
	return ${callPrefix}(schema as any, {
		...options,
		runtimeEnv: {
			${runtimeEnvLines}
		},
	} as any);
}
${GENERATED_FOOTER}`;
}
