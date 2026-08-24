import { detectCodeFormat, generateCode, parseModule } from "magicast";

/**
 * Results of analyzing a project for legacy v0 patterns.
 */
export type MigrationDetectionResult = {
	isLegacy: boolean;
	hasLegacyEnvFile: boolean;
	hasLegacyViteConfig: boolean;
	hasLegacyDtsFile: boolean;
	hasLegacyPackageJson: boolean;
	reasons: string[];
};

/**
 * Represents a single file migration change.
 */
export type FileMigrationChange = {
	filePath: string;
	originalContent: string;
	updatedContent: string;
	hasChanged: boolean;
	description: string;
	error?: string;
};

/**
 * Result of migrating an entire project.
 */
export type ProjectMigrationResult = {
	success: boolean;
	dryRun: boolean;
	changes: FileMigrationChange[];
	manualInstructions: string[];
	errors: string[];
};

/**
 * Normalizes named import spacing in generated code.
 */
function normalizeImportSpacing(code: string): string {
	return code.replace(
		/import\s*\{([^\n}]*)\}\s*from/g,
		(_match, p1) => `import { ${p1.trim()} } from`,
	);
}

/**
 * Preserves trailing newline of original code.
 */
function preserveTrailingNewline(code: string, originalCode: string): string {
	return originalCode.endsWith("\n") && !code.endsWith("\n")
		? `${code}\n`
		: code;
}

/**
 * Detects if an env schema file uses legacy v0 patterns.
 */
export function isLegacyEnvCode(code: string): boolean {
	// 1. Checks for export const Env = ...
	const hasEnvExport = /\bexport\s+(?:const|let|var)\s+Env\b/.test(code);
	// 2. Checks for library import from "arkenv" (the v0 library name)
	const hasArkenvLibraryImport =
		/from\s+['"]arkenv['"]/.test(code) ||
		/require\(['"]arkenv['"]\)/.test(code);
	// 3. Checks for type({ ... }) export without arkenv() wrap
	const hasBareTypeExport =
		/\bexport\s+const\s+Env\s*=\s*type\s*\(/.test(code) &&
		!/\bexport\s+const\s+env\s*=\s*arkenv\b/.test(code);

	return hasEnvExport || hasArkenvLibraryImport || hasBareTypeExport;
}

/**
 * Detects if a Vite config file uses legacy v0 plugin calls or Env imports.
 */
export function isLegacyViteConfigCode(code: string): boolean {
	const hasEnvImport =
		/import\s*\{[^}]*\bEnv\b[^}]*\}\s*from/.test(code) ||
		/require\([^)]*\)\.Env/.test(code);
	const hasPluginWithEnvArg =
		/\barkenv(?:Vite)?Plugin\s*\(\s*Env\s*\)/.test(code) ||
		/\barkenv\s*\(\s*Env\s*\)/.test(code);

	return hasEnvImport || hasPluginWithEnvArg;
}

/**
 * Detects if an ambient .d.ts file contains legacy ArkEnv augmentations.
 */
export function isLegacyDtsCode(code: string): boolean {
	return (
		code.includes("ImportMetaEnvAugmented") ||
		code.includes("ProcessEnvAugmented") ||
		/typeof\s+import\([^)]+\)\.Env/.test(code)
	);
}

/**
 * Detects if package.json uses "arkenv" as a library dependency.
 */
export function isLegacyPackageJsonCode(code: string): boolean {
	try {
		const pkg = JSON.parse(code);
		const deps = pkg.dependencies || {};
		const devDeps = pkg.devDependencies || {};
		return "arkenv" in deps || "arkenv" in devDeps;
	} catch {
		return false;
	}
}

/**
 * Detects legacy v0 patterns across provided files.
 */
export function detectLegacyProject(files: {
	envCode?: string | undefined;
	viteConfigCode?: string | undefined;
	dtsCode?: string | undefined;
	packageJsonCode?: string | undefined;
}): MigrationDetectionResult {
	const reasons: string[] = [];
	const hasLegacyEnvFile = files.envCode
		? isLegacyEnvCode(files.envCode)
		: false;
	const hasLegacyViteConfig = files.viteConfigCode
		? isLegacyViteConfigCode(files.viteConfigCode)
		: false;
	const hasLegacyDtsFile = files.dtsCode
		? isLegacyDtsCode(files.dtsCode)
		: false;
	const hasLegacyPackageJson = files.packageJsonCode
		? isLegacyPackageJsonCode(files.packageJsonCode)
		: false;

	if (hasLegacyEnvFile) {
		reasons.push(
			"Legacy schema definition (`export const Env`) or v0 import found in env schema.",
		);
	}
	if (hasLegacyViteConfig) {
		reasons.push(
			"Legacy plugin registration passing `Env` found in Vite config.",
		);
	}
	if (hasLegacyDtsFile) {
		reasons.push(
			"Legacy ambient environment augmentations found in declaration file.",
		);
	}
	if (hasLegacyPackageJson) {
		reasons.push(
			"Legacy 'arkenv' package declared as a runtime dependency in package.json.",
		);
	}

	const isLegacy =
		hasLegacyEnvFile ||
		hasLegacyViteConfig ||
		hasLegacyDtsFile ||
		hasLegacyPackageJson;

	return {
		isLegacy,
		hasLegacyEnvFile,
		hasLegacyViteConfig,
		hasLegacyDtsFile,
		hasLegacyPackageJson,
		reasons,
	};
}

/**
 * Migrates an env schema file from v0 (schema/define) to v1 canonical env-object.
 */
export function migrateEnvCode(code: string): {
	code: string;
	updated: boolean;
	error?: string;
} {
	try {
		let updatedCode = code;

		// Detect validator dialect
		const isZod = /from\s+['"]zod['"]/.test(code);
		const isValibot = /from\s+['"]valibot['"]/.test(code);
		const isStandard = isZod || isValibot;

		// 1. Replace v0 "arkenv" import with "@arkenv/core" or "@arkenv/standard"
		if (/from\s+['"]arkenv['"]/.test(updatedCode)) {
			const targetPackage = isStandard ? "@arkenv/standard" : "@arkenv/core";
			updatedCode = updatedCode.replace(
				/from\s+['"]arkenv['"]/g,
				`from "${targetPackage}"`,
			);
		}

		// 2. If importing { type } from "arktype" or "@arkenv/core" without arkenv default import
		if (!/import\s+arkenv\b/.test(updatedCode)) {
			if (
				/import\s*\{\s*type\s*\}\s*from\s*['"](?:arktype|@arkenv\/core)['"]/.test(
					updatedCode,
				)
			) {
				updatedCode = updatedCode.replace(
					/import\s*\{\s*type\s*\}\s*from\s*['"](?:arktype|@arkenv\/core)['"];?/,
					`import arkenv, { type } from "@arkenv/core";`,
				);
			} else if (isStandard) {
				updatedCode = `import arkenv from "@arkenv/standard";\n${updatedCode}`;
			} else {
				updatedCode = `import arkenv, { type } from "@arkenv/core";\n${updatedCode}`;
			}
		}

		// 3. Rewrite `export const Env = type({` -> `export const env = arkenv({`
		if (
			/export\s+(?:const|let|var)\s+Env\s*=\s*type\s*\(\{/.test(updatedCode)
		) {
			updatedCode = updatedCode.replace(
				/export\s+(?:const|let|var)\s+Env\s*=\s*type\s*\(\{/g,
				"export const env = arkenv({",
			);
		} else if (
			/export\s+(?:const|let|var)\s+Env\s*=\s*type\s*\(/.test(updatedCode)
		) {
			updatedCode = updatedCode.replace(
				/export\s+(?:const|let|var)\s+Env\s*=\s*type\s*\(/g,
				"export const env = arkenv(type(",
			);
		} else if (
			/export\s+(?:const|let|var)\s+Env\s*=\s*arkenv\s*\(/.test(updatedCode)
		) {
			updatedCode = updatedCode.replace(
				/export\s+(?:const|let|var)\s+Env\s*=\s*arkenv\s*\(/g,
				"export const env = arkenv(",
			);
		} else if (/export\s+(?:const|let|var)\s+Env\s*=\s*\{/.test(updatedCode)) {
			updatedCode = updatedCode.replace(
				/export\s+(?:const|let|var)\s+Env\s*=\s*\{/g,
				"export const env = arkenv({",
			);
		} else if (/export\s+(?:const|let|var)\s+Env\s*=/.test(updatedCode)) {
			updatedCode = updatedCode.replace(
				/export\s+(?:const|let|var)\s+Env\s*=/g,
				"export const env = arkenv(",
			);
			if (!updatedCode.endsWith(");") && !updatedCode.endsWith(");\n")) {
				updatedCode = updatedCode.trimEnd() + ");\n";
			}
		}

		// If there is an existing redundant `export const env = arkenv(Env);` following `export const env = ...`
		if (
			updatedCode.includes("export const env = arkenv({") &&
			/export\s+const\s+env\s*=\s*arkenv\(Env\);?/.test(updatedCode)
		) {
			updatedCode = updatedCode.replace(
				/\n*\s*export\s+const\s+env\s*=\s*arkenv\(Env\);?/g,
				"",
			);
		}

		// Normalize exports - ensure `export default env;` or `export { env }`
		if (
			!updatedCode.includes("export default env") &&
			!updatedCode.includes("export { env }")
		) {
			updatedCode = `${updatedCode.trimEnd()}\n\nexport default env;\n`;
		}

		updatedCode = preserveTrailingNewline(updatedCode, code);

		return {
			code: updatedCode,
			updated: updatedCode !== code,
		};
	} catch (e: unknown) {
		return {
			code,
			updated: false,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}

/**
 * Migrates a Vite config file by removing Env imports and zero-arging arkenvVitePlugin().
 */
export function migrateViteConfigCode(code: string): {
	code: string;
	updated: boolean;
	error?: string;
} {
	let updatedCode = code;
	let wasUpdated = false;

	// Try AST manipulation via magicast first
	try {
		const mod = parseModule(code);
		let astModified = false;

		// 1. Clean up imports: remove `Env` from imports from env files
		for (const [key, imp] of Object.entries(mod.imports)) {
			if (key === "$add") continue;
			const importDecl = imp as {
				from?: string;
				imported?: string;
				local?: string;
			};
			if (
				importDecl &&
				(importDecl.from?.includes("env") || importDecl.imported === "Env")
			) {
				if (importDecl.imported === "Env" && !importDecl.local) {
					delete mod.imports[key];
					astModified = true;
				}
			}
		}

		if (astModified) {
			const gen = generateCode(mod, { format: detectCodeFormat(code) });
			updatedCode = gen.code;
			wasUpdated = true;
		}
	} catch {
		// Fall through to regex-based robust transformation
	}

	// 2. Regex pass for removing Env imports
	const importEnvRegex =
		/import\s*\{\s*Env\s*\}\s*from\s*['"][^'"]+['"];?\r?\n?/g;
	if (importEnvRegex.test(updatedCode)) {
		updatedCode = updatedCode.replace(importEnvRegex, "");
		wasUpdated = true;
	}

	// Remove Env from multi-specifier imports: `import { Env, something } from ...`
	const multiImportEnvRegex =
		/import\s*\{([^}]*)\bEnv\b,?\s*([^}]*)\}\s*from\s*(['"][^'"]+['"]);?/g;
	if (multiImportEnvRegex.test(updatedCode)) {
		updatedCode = updatedCode.replace(
			multiImportEnvRegex,
			(_match, before, after, source) => {
				const remaining = `${before} ${after}`
					.replace(/,\s*,/g, ",")
					.trim()
					.replace(/^,\s*/, "")
					.replace(/\s*,$/, "")
					.trim();
				if (!remaining) return "";
				return `import { ${remaining} } from ${source};`;
			},
		);
		wasUpdated = true;
	}

	// 3. Rewrite plugin calls: arkenvVitePlugin(Env) -> arkenvVitePlugin()
	const pluginCallRegexes = [
		/(\barkenv(?:Vite)?Plugin\s*)\(\s*Env\s*\)/g,
		/(\barkenv\s*)\(\s*Env\s*\)/g,
	];

	for (const regex of pluginCallRegexes) {
		if (regex.test(updatedCode)) {
			updatedCode = updatedCode.replace(regex, "$1()");
			wasUpdated = true;
		}
	}

	updatedCode = normalizeImportSpacing(updatedCode);
	updatedCode = preserveTrailingNewline(updatedCode, code);

	return {
		code: updatedCode,
		updated: wasUpdated || updatedCode !== code,
	};
}

/**
 * Migrates ambient declaration files by stripping ArkEnv augmentation blocks.
 */
export function migrateDtsCode(code: string): {
	code: string;
	updated: boolean;
	shouldDelete: boolean;
} {
	let updatedCode = code;

	// Strip ImportMetaEnv / ProcessEnv augmentations
	updatedCode = updatedCode.replace(
		/\/\/\/ <reference types="vite\/client" \/>\s*/g,
		"",
	);
	updatedCode = updatedCode.replace(
		/\/\/\/ <reference types="bun-types" \/>\s*/g,
		"",
	);
	updatedCode = updatedCode.replace(
		/type\s+ImportMetaEnvAugmented\s*=\s*import\([^)]+\)\.ImportMetaEnvAugmented<[^>]+>;?\s*/g,
		"",
	);
	updatedCode = updatedCode.replace(
		/interface\s+ImportMetaEnv\s+extends\s+ImportMetaEnvAugmented\s*\{\s*\}\s*/g,
		"",
	);
	updatedCode = updatedCode.replace(
		/interface\s+ImportMeta\s*\{\s*readonly\s+env:\s*ImportMetaEnv;\s*\}\s*/g,
		"",
	);
	updatedCode = updatedCode.replace(
		/type\s+ProcessEnvAugmented\s*=\s*import\([^)]+\)\.ProcessEnvAugmented<[^>]+>;?\s*/g,
		"",
	);
	updatedCode = updatedCode.replace(
		/declare\s+namespace\s+NodeJS\s*\{\s*interface\s+ProcessEnv\s+extends\s+ProcessEnvAugmented\s*\{\s*\}\s*\}\s*/g,
		"",
	);

	const trimmed = updatedCode.trim();
	const shouldDelete = trimmed === "";

	// If it contains other types/declarations, restore the reference tag if Vite
	if (!shouldDelete && code.includes("vite/client")) {
		updatedCode = `/// <reference types="vite/client" />\n\n${trimmed}\n`;
	} else if (!shouldDelete && code.includes("bun-types")) {
		updatedCode = `/// <reference types="bun-types" />\n\n${trimmed}\n`;
	} else if (shouldDelete && code.includes("vite/client")) {
		// Standard Vite project vite-env.d.ts keep the reference tag
		updatedCode = '/// <reference types="vite/client" />\n';
		return {
			code: updatedCode,
			updated: updatedCode !== code,
			shouldDelete: false,
		};
	}

	return {
		code: updatedCode,
		updated: updatedCode !== code,
		shouldDelete,
	};
}

/**
 * Migrates package.json dependencies replacing "arkenv" with "@arkenv/core" or "@arkenv/standard".
 */
export function migratePackageJsonCode(
	code: string,
	targetCorePackage: "@arkenv/core" | "@arkenv/standard" = "@arkenv/core",
): {
	code: string;
	updated: boolean;
	error?: string;
} {
	try {
		const pkg = JSON.parse(code);
		let updated = false;

		if (pkg.dependencies && "arkenv" in pkg.dependencies) {
			const version = pkg.dependencies.arkenv;
			delete pkg.dependencies.arkenv;
			pkg.dependencies[targetCorePackage] = version.startsWith("^")
				? "^1.0.0"
				: "^1.0.0-alpha.1";
			updated = true;
		}

		if (pkg.devDependencies && "arkenv" in pkg.devDependencies) {
			const version = pkg.devDependencies.arkenv;
			delete pkg.devDependencies.arkenv;
			pkg.devDependencies[targetCorePackage] = version.startsWith("^")
				? "^1.0.0"
				: "^1.0.0-alpha.1";
			updated = true;
		}

		if (!updated) {
			return { code, updated: false };
		}

		return {
			code: JSON.stringify(pkg, null, 2) + "\n",
			updated: true,
		};
	} catch (e: unknown) {
		return {
			code,
			updated: false,
			error: e instanceof Error ? e.message : String(e),
		};
	}
}
