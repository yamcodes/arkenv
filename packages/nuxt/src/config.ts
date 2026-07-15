import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	extractKeys as coreExtractKeys,
	extractClientKeys,
	extractSharedKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";
import {
	type BuildLogHelpers,
	formatBuildError,
	type Logger,
	type LogLevel,
	resolveBuildLog,
} from "@repo/log";
import { createJiti } from "jiti";
import { withForceServer } from "./validate-context";

export type {
	LayoutInput,
	LayoutMode,
	Logger,
	ResolvedLayout,
} from "@arkenv/build";
export {
	extractArkenvBlock,
	extractServerKeys,
	findSchemaPath,
	resolveLayout,
} from "@arkenv/build";
export { extractClientKeys, extractSharedKeys };

let hasWarnedSimpleLayout = false;

export function normalizeLayout(
	layout: ArkEnvConfigOptions["layout"],
	buildLog: BuildLogHelpers,
): "simple" | "strict" | undefined {
	if (layout === "simple") {
		if (process.env.NODE_ENV === "development" && !hasWarnedSimpleLayout) {
			hasWarnedSimpleLayout = true;
			buildLog.logBuildWarning(
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

export type ArkEnvConfigOptions = {
	schemaPath?: string;
	layout?:
		| "flat"
		| "strict"
		/** @deprecated Use `"flat"` instead. */
		| "simple";
	validate?: boolean;
	logger?: Logger;
	logLevel?: LogLevel;
};

export function setupArkEnv(
	options?: ArkEnvConfigOptions,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
	const buildLog = resolveBuildLog(options);

	const schemaPath = options?.schemaPath
		? path.resolve(options.schemaPath)
		: findSchemaPath();

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
				}. Please specify 'schemaPath' in ArkEnv options.`,
			),
		);
	}

	const normalizedLayout = normalizeLayout(options?.layout, buildLog);

	const { layout: resolvedLayout, baseDir } = resolveLayout(
		schemaPath,
		normalizedLayout,
	);

	const runValidation = options?.validate ?? true;
	if (runValidation) {
		try {
			validateSchema(schemaPath, resolvedLayout, baseDir, internalOptions);
		} catch (error: unknown) {
			buildLog.logBuildError("Environment validation failed:");
			buildLog.logBuildErrorDetail(
				error instanceof Error ? error.message : String(error),
			);
			buildLog.logBuildErrorBlankLine();
			throw error;
		}
	}
}

export function validateSchema(
	schemaPath: string,
	resolvedLayout: "simple" | "strict",
	baseDir: string,
	internalOptions?: { _jitiAliases?: Record<string, string> },
): void {
	withForceServer(() => {
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

		const packageJsonPath = path.resolve(dir, "../package.json");
		let pkgExports: Record<string, unknown> = {};
		try {
			const pkgContent = fs.readFileSync(packageJsonPath, "utf-8");
			pkgExports = JSON.parse(pkgContent).exports || {};
		} catch {
			// fallback if package.json isn't adjacent/found
		}

		const resolveExportPath = (
			subpath: string,
			fallbackFile: string,
		): string => {
			const entry = pkgExports[subpath] as
				| { import?: string; default?: string }
				| string
				| undefined;
			if (entry) {
				const target =
					typeof entry === "string"
						? entry
						: entry.import || entry.default || entry;
				if (typeof target === "string") {
					const fileBasename = path.basename(target).replace(/\.m?[jt]s$/, "");
					const tsPath = path.join(dir, `${fileBasename}.ts`);
					if (fs.existsSync(tsPath)) {
						return tsPath;
					}
					const jsPath = path.join(dir, `${fileBasename}.js`);
					if (fs.existsSync(jsPath)) {
						return jsPath;
					}
				}
			}
			return fallbackFile;
		};

		const sharedPath = resolveExportPath(
			"./shared",
			fs.existsSync(path.join(dir, "shared.ts"))
				? path.join(dir, "shared.ts")
				: path.join(dir, "shared.js"),
		);
		const indexPath = resolveExportPath(
			".",
			fs.existsSync(path.join(dir, "index.ts"))
				? path.join(dir, "index.ts")
				: path.join(dir, "index.js"),
		);
		const clientPath = resolveExportPath(
			"./client",
			fs.existsSync(path.join(dir, "client.ts"))
				? path.join(dir, "client.ts")
				: path.join(dir, "client.js"),
		);
		const serverPath = resolveExportPath(
			"./server",
			fs.existsSync(path.join(dir, "server.ts"))
				? path.join(dir, "server.ts")
				: path.join(dir, "server.js"),
		);

		const mockImportsPath = fs.existsSync(path.join(dir, "mock-imports.ts"))
			? path.join(dir, "mock-imports.ts")
			: fs.existsSync(path.join(dir, "mock-imports.js"))
				? path.join(dir, "mock-imports.js")
				: path.join(dir, "mock-imports.cjs");

		const aliases: Record<string, string> = {
			"@arkenv/nuxt/shared": sharedPath,
			"@arkenv/nuxt": indexPath,
			"@arkenv/nuxt/client": clientPath,
			"@arkenv/nuxt/server": serverPath,
			"#imports": mockImportsPath,
			...internalOptions?._jitiAliases,
		};

		const jitiOptions = {
			moduleCache: false,
			fsCache: false,
			tsconfigPaths: true,
			alias: aliases,
		} as const;

		try {
			const jiti = createJiti(fileToEvaluate, jitiOptions);
			jiti(fileToEvaluate);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			const isTsconfigNotFound =
				error instanceof Error &&
				/tsconfig/i.test(message) &&
				(/not found/i.test(message) ||
					(error as NodeJS.ErrnoException).code === "ENOENT");

			if (isTsconfigNotFound) {
				const fallbackJiti = createJiti(fileToEvaluate, {
					...jitiOptions,
					tsconfigPaths: false,
				});
				fallbackJiti(fileToEvaluate);
				return;
			}
			throw error;
		}
	});
}

export function extractKeys(content: string): {
	serverKeys: string[];
	clientKeys: string[];
	sharedKeys: string[];
	isLegacy?: boolean;
} {
	return coreExtractKeys(content, "NUXT_PUBLIC_");
}
