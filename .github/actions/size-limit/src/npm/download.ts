import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";

// Function to download and extract npm package
export const downloadNpmPackage = async (
	packageName: string,
	version: string,
	targetDir: string,
): Promise<boolean> => {
	try {
		// Create target directory
		if (!existsSync(targetDir)) {
			mkdirSync(targetDir, { recursive: true });
		}

		// Construct tarball URL
		// For scoped packages: @scope/name -> name-version.tgz (e.g., @arkenv/vite-plugin -> vite-plugin-0.0.14.tgz)
		// For unscoped packages: name -> name-version.tgz
		const tarballName = packageName.startsWith("@")
			? `${packageName.split("/")[1]}-${version}.tgz`
			: `${packageName}-${version}.tgz`;
		const tarballUrl = `https://registry.npmjs.org/${packageName}/-/${tarballName}`;

		console.log(
			`📦 Downloading ${packageName}@${version} from ${tarballUrl}...`,
		);
		const tarballPath = join(targetDir, "package.tgz");
		const downloadProc = spawn(
			["curl", "-L", "-f", "-o", tarballPath, tarballUrl],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const [downloadStdout, downloadStderr] = await Promise.all([
			new Response(downloadProc.stdout).text(),
			new Response(downloadProc.stderr).text(),
		]);

		const downloadExitCode = await downloadProc.exited;
		if (downloadExitCode !== 0) {
			console.log(
				`⚠️ Failed to download ${packageName}@${version}: ${downloadStderr || downloadStdout}`,
			);
			return false;
		}

		// Verify the downloaded file exists and is not empty
		if (!existsSync(tarballPath)) {
			console.log(`⚠️ Downloaded file not found: ${tarballPath}`);
			return false;
		}

		// Check if file is a valid gzip file (tarballs start with gzip magic bytes)
		const fileContent = readFileSync(tarballPath);
		const isGzip = fileContent[0] === 0x1f && fileContent[1] === 0x8b;
		if (!isGzip) {
			// If it's not gzip, it might be an error page (HTML)
			const contentStr = fileContent.slice(0, 200).toString();
			console.log(
				`⚠️ Downloaded file is not a valid gzip archive. First 200 bytes: ${contentStr}`,
			);
			return false;
		}

		// Extract tarball
		// npm tarballs have a "package" directory inside, so we extract to temp first
		const tempExtractDir = join(targetDir, "temp-extract");
		mkdirSync(tempExtractDir, { recursive: true });

		const extractProc = spawn(
			["tar", "-xzf", join(targetDir, "package.tgz"), "-C", tempExtractDir],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const extractExitCode = await extractProc.exited;
		if (extractExitCode !== 0) {
			const [extractStdout, extractStderr] = await Promise.all([
				new Response(extractProc.stdout).text(),
				new Response(extractProc.stderr).text(),
			]);
			console.log(
				`⚠️ Failed to extract ${packageName}@${version}: ${extractStderr || extractStdout}`,
			);
			return false;
		}

		// Move contents from package/ subdirectory to targetDir
		const packageSubdir = join(tempExtractDir, "package");
		if (existsSync(packageSubdir)) {
			// Use cp to copy all contents, then remove temp dir
			const moveProc = spawn(
				[
					"sh",
					"-c",
					`cp -r ${packageSubdir}/* ${targetDir}/ && cp -r ${packageSubdir}/.[!.]* ${targetDir}/ 2>/dev/null || true`,
				],
				{
					stdout: "pipe",
					stderr: "pipe",
				},
			);
			await moveProc.exited;
		}

		// Clean up temp extract dir and tarball
		if (existsSync(tempExtractDir)) {
			rmSync(tempExtractDir, { recursive: true, force: true });
		}
		// tarballPath is already declared above, just clean it up
		if (existsSync(tarballPath)) {
			rmSync(tarballPath, { force: true });
		}

		return true;
	} catch (error) {
		console.log(
			`⚠️ Error downloading ${packageName}@${version}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return false;
	}
};
