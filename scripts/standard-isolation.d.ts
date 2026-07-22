/** Packages that must never appear in a `/standard` entry's import graph. */
export const FORBIDDEN_STANDARD_DEPS: ReadonlyArray<"arktype" | "@arkenv/core">;

export function getStandardExportEntries(
	packageDir: string,
	condition?: "import" | "require",
): Array<{ exportPath: string; filePath: string }>;

export function ensurePackageDist(
	packageDir: string,
	entryFiles: string[],
): void;

export function isForbiddenStandardDep(specifier: string): boolean;

export function assertStandardEntryIsolated(
	entryFile: string,
	context?: { packageName?: string; exportPath?: string },
): Promise<void>;

export function assertPackageStandardIsolation(
	packageDir: string,
	options?: { conditions?: Array<"import" | "require"> },
): Promise<{ packageName: string; checked: string[] }>;

export function assertPackagesStandardIsolation(
	packageDirs: string[],
): Promise<void>;

export function resolvePackageDirs(
	rootDir: string,
	relativePackageDirs: string[],
): string[];
