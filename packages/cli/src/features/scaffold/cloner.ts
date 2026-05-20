import fsp from "node:fs/promises";
import path from "node:path";
import type { Workspace } from "./plan";

export async function cloneTemplate(
	workspace: Workspace,
	cloneInfo: {
		repository: string;
		template: string;
		targetName: string;
	},
): Promise<void> {
	const tempDir = path.join(process.cwd(), ".arkenv-temp");
	await workspace.mkdir(tempDir, true);

	try {
		// Clone sparsely
		await workspace.execute("git", [
			"clone",
			"--filter=blob:none",
			"--sparse",
			cloneInfo.repository,
			tempDir,
		]);

		// Checkout the specific example
		const examplePath = `examples/${cloneInfo.template}`;
		await workspace.execute("git", [
			"-C",
			tempDir,
			"sparse-checkout",
			"set",
			examplePath,
		]);

		// Move files to current directory
		const fullExamplePath = path.join(tempDir, examplePath);
		await copyDirectoryContents(fullExamplePath, process.cwd());

		// Update package.json name
		const pkgPath = path.join(process.cwd(), "package.json");
		if (await workspace.exists(pkgPath)) {
			const pkgContent = await workspace.readFile(pkgPath);
			const pkg = JSON.parse(pkgContent);
			pkg.name = cloneInfo.targetName;
			await workspace.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
		}
	} finally {
		// Cleanup temp dir
		await fsp.rm(tempDir, { recursive: true, force: true });
	}
}

async function copyDirectoryContents(source: string, destination: string) {
	const entries = await fsp.readdir(source);
	await Promise.all(
		entries.map((entry) =>
			fsp.cp(path.join(source, entry), path.join(destination, entry), {
				recursive: true,
				force: false,
			}),
		),
	);
}
