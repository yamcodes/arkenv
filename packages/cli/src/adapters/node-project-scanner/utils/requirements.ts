import fsp from "node:fs/promises";
import path from "node:path";
import type { RequirementCheckResult } from "@/shared/ports";
import { checkTsConfig } from "./tsconfig";

/**
 * Simple semver comparison.
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
function compareSemver(v1: string, v2: string): number {
	const p1 = v1.replace(/^v/, "").split(".").map(Number);
	const p2 = v2.replace(/^v/, "").split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		const n1 = p1[i] || 0;
		const n2 = p2[i] || 0;
		if (n1 > n2) return 1;
		if (n1 < n2) return -1;
	}
	return 0;
}

export async function checkRequirements(
	cwd = process.cwd(),
): Promise<RequirementCheckResult[]> {
	const results: RequirementCheckResult[] = [];

	// 1. Node.js version check
	const nodeVersion = process.version;
	const minNodeVersion = "18.0.0";
	if (compareSemver(nodeVersion, minNodeVersion) === -1) {
		results.push({
			status: "fail",
			requirement: "Node.js Version",
			message: `Node.js version must be >= ${minNodeVersion}.`,
			current: nodeVersion,
			expected: `>= ${minNodeVersion}`,
		});
	} else {
		results.push({
			status: "pass",
			requirement: "Node.js Version",
			message: "Node.js version is compatible.",
		});
	}

	// 2. package.json check
	let pkg: any = null;
	try {
		const pkgJsonPath = path.join(cwd, "package.json");
		const content = await fsp.readFile(pkgJsonPath, "utf-8");
		pkg = JSON.parse(content);
		results.push({
			status: "pass",
			requirement: "package.json",
			message: "package.json found.",
		});
	} catch {
		results.push({
			status: "warn",
			requirement: "package.json",
			message: "package.json not found in the current directory.",
		});
	}

	// 3. TypeScript version check
	if (pkg) {
		const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
		const tsVersion = allDeps.typescript;
		const minTsVersion = "5.1.0";

		if (tsVersion) {
			// Clean version string (remove ^, ~, etc. for simple check, or use semver properly)
			// Actually radashi semver might handle it or we can just try to satisfy it
			// For simplicity let's assume it's a semver range and check if 5.1.0 is compatible or if the current installed version is >= 5.1.0
			// Since we can't easily know the *installed* version without running a command, we check the declared version.
			const cleanVersion = tsVersion.replace(/^[\^~]/, "");
			if (
				/^\d/.test(cleanVersion) &&
				compareSemver(cleanVersion, minTsVersion) === -1
			) {
				results.push({
					status: "fail",
					requirement: "TypeScript Version",
					message: `TypeScript version should be >= ${minTsVersion}.`,
					current: tsVersion,
					expected: `>= ${minTsVersion}`,
				});
			} else {
				results.push({
					status: "pass",
					requirement: "TypeScript Version",
					message: "TypeScript version is compatible.",
				});
			}
		} else {
			results.push({
				status: "warn",
				requirement: "TypeScript Version",
				message: "TypeScript not found in package.json dependencies.",
			});
		}
	}

	// 4. tsconfig.json checks
	const tsConfigRes = await checkTsConfig(cwd);
	if (tsConfigRes.status === "not_found") {
		results.push({
			status: "warn",
			requirement: "tsconfig.json",
			message: "tsconfig.json not found.",
		});
	} else {
		const parsed = tsConfigRes.parsed!;
		const compilerOptions = parsed.compilerOptions || {};

		// Strict mode
		if (compilerOptions.strict === true) {
			results.push({
				status: "pass",
				requirement: "TypeScript Strict Mode",
				message: "Strict mode is enabled.",
			});
		} else {
			results.push({
				status: "fail",
				requirement: "TypeScript Strict Mode",
				message: "Strict mode must be enabled.",
				current: "false",
				expected: "true",
			});
		}

		// moduleResolution
		const moduleRes = compilerOptions.moduleResolution?.toLowerCase();
		const moduleType = compilerOptions.module?.toLowerCase();

		const validResolutions = ["bundler", "node16", "nodenext"];
		const isValidResolution = validResolutions.includes(moduleRes || "");

		// If module is node16 or nodenext, moduleResolution defaults to that if not specified
		const isImplicitlyValid =
			!moduleRes && (moduleType === "node16" || moduleType === "nodenext");

		if (isValidResolution || isImplicitlyValid) {
			results.push({
				status: "pass",
				requirement: "TypeScript moduleResolution",
				message: `moduleResolution is set to ${moduleRes || "implicit"}.`,
			});
		} else {
			results.push({
				status: "fail",
				requirement: "TypeScript moduleResolution",
				message:
					"moduleResolution must be set to 'bundler', 'node16', or 'nodenext'.",
				current: moduleRes || "default",
				expected: "bundler, node16, or nodenext",
			});
		}
	}

	return results;
}
