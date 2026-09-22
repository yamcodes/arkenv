#!/usr/bin/env node

const path = require("node:path");
const { createRequire } = require("node:module");
const { spawn } = require("node:child_process");

const requireFromWww = createRequire(
	path.resolve(__dirname, "../package.json"),
);

// Skip postinstall during tests - types aren't needed for running tests
if (process.env.SKIP_POSTINSTALL === "true") {
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

// Avoid running when @arkenv/fumadocs-ui is not built yet (e.g. fresh CI install)
try {
	require.resolve("@arkenv/fumadocs-ui/dist/utils/index.js");
} catch {
	console.warn(
		"Skipping fumadocs-mdx: @arkenv/fumadocs-ui is not built (dist missing).",
	);
	process.exit(0);
}

// Resolve fumadocs-mdx via the www package graph (Nub identity — no pnpm exec)
const fumadocsMdxBin = requireFromWww.resolve("fumadocs-mdx/dist/bin.js");
const child = spawn(process.execPath, [fumadocsMdxBin], {
	stdio: "inherit",
	cwd: path.resolve(__dirname, ".."),
	shell: false,
});

// Forward exit code
child.on("exit", (code) => {
	process.exit(code ?? 1);
});

child.on("error", (error) => {
	console.error("Failed to start fumadocs-mdx:", error);
	process.exit(1);
});
