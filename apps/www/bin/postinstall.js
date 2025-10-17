#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");

// Get Node.js major version
const nodeVersion = process.version;
const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0]);

// Set NODE_OPTIONS based on Node.js version
if (majorVersion >= 25) {
	// Node.js 25+ has Web Storage enabled by default, disable it to avoid localStorage conflicts
	process.env.NODE_OPTIONS = "--no-experimental-webstorage";
} else {
	// Node.js 24 and below don't have Web Storage enabled, no flags needed
	process.env.NODE_OPTIONS = "";
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
	process.exit(code);
});

child.on("error", (error) => {
	console.error("Failed to start fumadocs-mdx:", error);
	process.exit(1);
});
