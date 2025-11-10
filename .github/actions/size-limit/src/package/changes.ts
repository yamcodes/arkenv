import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";

export type ChangedPackagesResult =
	| { success: true; packages: Set<string> }
	| { success: false };

// Function to get changed packages based on git diff
export const getChangedPackages = async (
	baseBranch: string,
): Promise<ChangedPackagesResult> => {
	const changedPackages = new Set<string>();

	try {
		// First, ensure we have the base branch fetched
		const fetchProc = spawn(["git", "fetch", "origin", baseBranch], {
			stdout: "pipe",
			stderr: "pipe",
		});
		const fetchExitCode = await fetchProc.exited;
		if (fetchExitCode !== 0) {
			const [fetchStdout, fetchStderr] = await Promise.all([
				new Response(fetchProc.stdout).text(),
				new Response(fetchProc.stderr).text(),
			]);
			console.log(
				`⚠️ Failed to fetch ${baseBranch}: ${fetchStderr || fetchStdout}. Falling back to checking all packages.`,
			);
			return { success: false };
		}

		// Get list of changed files between base and HEAD
		// Use three-dot diff to get files changed in HEAD compared to base
		// This shows files changed in HEAD that aren't in base
		const diffProc = spawn(
			["git", "diff", "--name-only", `origin/${baseBranch}...HEAD`],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const [stdout, stderr] = await Promise.all([
			new Response(diffProc.stdout).text(),
			new Response(diffProc.stderr).text(),
		]);

		const exitCode = await diffProc.exited;
		if (exitCode !== 0) {
			console.log(
				`⚠️ Failed to get changed files: ${stderr || stdout}. Falling back to checking all packages.`,
			);
			return { success: false };
		}

		const changedFiles = stdout
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		// Map changed files to packages
		for (const file of changedFiles) {
			// Check if file is in packages directory
			const packagesMatch = file.match(
				/^packages\/([@a-z0-9][@a-z0-9/_-]*)\//i,
			);
			if (packagesMatch?.[1]) {
				const packageDir = packagesMatch[1];

				// Get actual package name from package.json
				const packageJsonPath = join(
					process.cwd(),
					"packages",
					packageDir,
					"package.json",
				);
				if (existsSync(packageJsonPath)) {
					try {
						const packageJson = JSON.parse(
							readFileSync(packageJsonPath, "utf-8"),
						);
						if (packageJson.name) {
							changedPackages.add(packageJson.name);
						} else {
							changedPackages.add(packageDir);
						}
					} catch {
						changedPackages.add(packageDir);
					}
				} else {
					changedPackages.add(packageDir);
				}
			}
		}

		if (changedPackages.size > 0) {
			console.log(
				`📦 Detected changed packages: ${Array.from(changedPackages).join(", ")}`,
			);
		} else {
			console.log("📦 No packages changed in this PR");
		}

		return { success: true, packages: changedPackages };
	} catch (error) {
		console.log(
			`⚠️ Error detecting changed packages: ${error instanceof Error ? error.message : String(error)}. Falling back to checking all packages.`,
		);
		return { success: false };
	}
};
