#!/usr/bin/env node

const { spawn, execSync } = require("node:child_process");
const path = require("node:path");

// Get Node.js major version
const nodeVersion = process.version;
const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0]);

// Set NODE_OPTIONS based on Node.js version
if (majorVersion >= 25) {
	// Node.js 25+ has Web Storage enabled by default, disable it to avoid localStorage conflicts
	const existingOptions = process.env.NODE_OPTIONS || "";
	const flag = "--no-experimental-webstorage";

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

// Spawn fumadocs-mdx with the appropriate NODE_OPTIONS
const child = spawn(
	"pnpm",
	["exec", "fumadocs-mdx", ...process.argv.slice(2)],
	{
		stdio: "inherit",
		shell: false,
	},
);

// Forward exit code
child.on("exit", (code) => {
	process.exit(code ?? 1);
});

child.on("error", (error) => {
	console.error("Failed to start fumadocs-mdx:", error);
	process.exit(1);
});
