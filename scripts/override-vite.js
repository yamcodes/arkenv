import fs from "node:fs";

const version = process.argv[2];
if (!version) {
	console.error("Missing version");
	process.exit(1);
}

// Map Vite version to compatible @vitejs/plugin-react version
const reactPluginVersions = {
	4: "^3.1.0",
	5: "^4.2.0",
	6: "^4.3.0",
	7: "^5.1.0",
	8: "^6.0.1",
};

const reactPluginVersion = reactPluginVersions[version];
if (!reactPluginVersion) {
	console.error(`Unsupported Vite version: ${version}`);
	process.exit(1);
}

const content = fs.readFileSync("pnpm-workspace.yaml", "utf8");
const lines = content.split("\n");
const overridesIndex = lines.findIndex((line) => line.trim() === "overrides:");

if (overridesIndex === -1) {
	console.error("No overrides block found in pnpm-workspace.yaml");
	process.exit(1);
}

// Add the vite and react plugin overrides under overrides:
lines.splice(overridesIndex + 1, 0, `  vite: "^${version}.0.0"`);
lines.splice(
	overridesIndex + 2,
	0,
	`  "@vitejs/plugin-react": "${reactPluginVersion}"`,
);

fs.writeFileSync("pnpm-workspace.yaml", lines.join("\n"), "utf8");
console.log(
	`Successfully added overrides for Vite ${version} and @vitejs/plugin-react ${reactPluginVersion}`,
);
