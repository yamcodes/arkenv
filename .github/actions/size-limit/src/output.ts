import type { SizeLimitResult } from "./types.ts";

// Create the markdown table from results
export const createTable = (results: SizeLimitResult[]): string => {
	if (results.length === 0) {
		return "```\nNo results found\n```";
	}

	// Log file information to console (not included in GitHub comment)
	for (const r of results) {
		console.log(`📦 ${r.package} → ${r.file}: ${r.size} (limit: ${r.limit})`);
	}

	const tableRows = results
		.map(
			(r) =>
				`| \`${r.package}\` | \`${r.size}\` | \`${r.limit}\` | \`${r.diff ?? "—"}\` | ${r.status} |`,
		)
		.join("\n");
	return `| Package | Size | Limit | Diff | Status |\n|:--- | :---:| :---:| :---:| :---:|\n${tableRows}`;
};

// Set GitHub outputs
export const setGitHubOutputs = async (
	result: string,
	hasErrors: boolean,
	packagesChanged: boolean,
): Promise<void> => {
	const githubOutput = process.env.GITHUB_OUTPUT;
	if (!githubOutput) {
		return;
	}

	const fs = await import("node:fs/promises");
	const output = `result<<EOF\n${result}\nEOF\nhas_errors=${hasErrors}\npackages_changed=${packagesChanged}\n`;
	await fs.appendFile(githubOutput, output);
};

// Handle early exit when no packages changed
export const handleNoPackagesChanged = async (): Promise<void> => {
	console.log("ℹ️ No packages changed in this PR. Skipping bundle size checks.");
	// Set GitHub outputs to indicate no packages changed
	const githubOutput = process.env.GITHUB_OUTPUT;
	if (githubOutput) {
		const fs = await import("node:fs/promises");
		const output =
			"result<<EOF\nNo packages changed in this PR.\nEOF\nhas_errors=false\npackages_changed=false\n";
		await fs.appendFile(githubOutput, output);
	}
	process.exit(0);
};
