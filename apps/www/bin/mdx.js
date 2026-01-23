#!/usr/bin/env node

const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Skip mdx types generation during tests - types aren't needed for running tests
if (process.env.SKIP_MDX === "true") {
	process.exit(0);
}

// Get Node.js major version
const nodeVersion = process.version;
const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0], 10);

// Set NODE_OPTIONS based on Node.js version
if (majorVersion >= 25) {
	// Node.js 25+ has Web Storage enabled by default, disable it to avoid localStorage conflicts
	const existingOptions = process.env.NODE_OPTIONS || "";
	const flag = "--no-webstorage";

	// Only add the flag if it's not already present
	if (!existingOptions.includes(flag)) {
		process.env.NODE_OPTIONS = existingOptions
			? `${existingOptions} ${flag}`
			: flag;
	}
}
// For Node.js 24 and below, leave existing NODE_OPTIONS unchanged

// Check if pnpm is available
try {
	execSync("pnpm --version", { stdio: "ignore" });
} catch {
	console.error("Error: pnpm is required but not found in PATH");
	process.exit(1);
}

// Skip if our MDX output already exists
const sourceConfigPath = path.join(process.cwd(), ".source", "source.config.mjs");
if (fs.existsSync(sourceConfigPath)) {
	process.exit(0);
}

// Spawn fumadocs-mdx with the appropriate NODE_OPTIONS
// Use shell: true on Windows for command resolution, false on Unix for security
const child = spawn("pnpm", ["exec", "fumadocs-mdx"], {
	stdio: "inherit",
	shell: process.platform === "win32",
});

// Forward exit code
child.on("exit", (code) => {
	process.exit(code ?? 1);
});

child.on("error", (error) => {
	console.error("Failed to start fumadocs-mdx:", error);
	process.exit(1);
});
