import fs from "node:fs";

const arg = process.argv[2];
if (!arg) {
	console.error("Missing version or --restore flag");
	process.exit(1);
}

const reactPluginVersions = {
	4: "^3.1.0",
	5: "^4.2.0",
	6: "^5.0.0",
	7: "^5.1.0",
	8: "^6.0.1",
};

const content = fs.readFileSync("pnpm-workspace.yaml", "utf8");
const lines = content.split("\n");
const overridesIndex = lines.findIndex((line) => line.trim() === "overrides:");

if (overridesIndex === -1) {
	console.error("No overrides block found in pnpm-workspace.yaml");
	process.exit(1);
}

// Separate lines into before overrides, inside overrides, and after overrides
const beforeOverrides = lines.slice(0, overridesIndex + 1);
const remainingLines = lines.slice(overridesIndex + 1);

const overridesLines = [];
const afterOverrides = [];
let insideOverrides = true;

for (const line of remainingLines) {
	if (insideOverrides) {
		// A line is still in overrides if it is empty or starts with space
		if (line.trim() === "" || line.startsWith(" ") || line.startsWith("\t")) {
			overridesLines.push(line);
		} else {
			insideOverrides = false;
			afterOverrides.push(line);
		}
	} else {
		afterOverrides.push(line);
	}
}

// Clean up existing vite and @vitejs/plugin-react overrides
const cleanOverridesLines = overridesLines.filter((line) => {
	const trimmed = line.trim();
	const isViteOverride = trimmed.startsWith("vite:");
	const isReactPluginOverride =
		trimmed.startsWith('"@vitejs/plugin-react":') ||
		trimmed.startsWith("'@vitejs/plugin-react':");
	return !isViteOverride && !isReactPluginOverride;
});

if (arg === "--restore") {
	const newContent = [
		...beforeOverrides,
		...cleanOverridesLines,
		...afterOverrides,
	].join("\n");
	fs.writeFileSync("pnpm-workspace.yaml", newContent, "utf8");
	console.log("Successfully restored pnpm-workspace.yaml");
	process.exit(0);
}

const reactPluginVersion = reactPluginVersions[arg];
if (!reactPluginVersion) {
	console.error(`Unsupported Vite version: ${arg}`);
	process.exit(1);
}

// Insert new overrides at the beginning of the clean overrides block
const newOverridesLines = [
	`  vite: "^${arg}.0.0"`,
	`  "@vitejs/plugin-react": "${reactPluginVersion}"`,
	...cleanOverridesLines,
];

const newContent = [
	...beforeOverrides,
	...newOverridesLines,
	...afterOverrides,
].join("\n");
fs.writeFileSync("pnpm-workspace.yaml", newContent, "utf8");
console.log(
	`Successfully added overrides for Vite ${arg} and @vitejs/plugin-react ${reactPluginVersion}`,
);
