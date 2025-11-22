#!/usr/bin/env node

const { spawn } = require("node:child_process");

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

// Get the command and arguments from process.argv
const [, , ...args] = process.argv;

// Spawn the command with the appropriate NODE_OPTIONS
const child = spawn("npx", args, {
	stdio: "inherit",
	shell: process.platform === "win32",
});

// Forward exit code
child.on("exit", (code) => {
	process.exit(code ?? 1);
});

child.on("error", (error) => {
	console.error("Failed to start command:", error);
	process.exit(1);
});
