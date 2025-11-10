import { spawn } from "bun";

// Function to get latest version of a package from npm
export const getLatestVersion = async (
	packageName: string,
): Promise<string | null> => {
	try {
		const proc = spawn(["npm", "view", packageName, "version"], {
			stdout: "pipe",
			stderr: "pipe",
		});

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		]);

		const exitCode = await proc.exited;
		if (exitCode !== 0) {
			console.log(`⚠️ Failed to get version for ${packageName}: ${stderr}`);
			return null;
		}

		return stdout.trim();
	} catch (error) {
		console.log(
			`⚠️ Error getting version for ${packageName}: ${error instanceof Error ? error.message : String(error)}`,
		);
		return null;
	}
};
