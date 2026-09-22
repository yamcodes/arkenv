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

const packageJsonPath = "package.json";
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const overrides = { ...(pkg.overrides ?? {}) };

delete overrides.vite;
delete overrides["@vitejs/plugin-react"];

if (arg === "--restore") {
	pkg.overrides = overrides;
	fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, "\t")}\n`);
	console.log("Successfully restored package.json overrides");
	process.exit(0);
}

const reactPluginVersion = reactPluginVersions[arg];
if (!reactPluginVersion) {
	console.error(`Unsupported Vite version: ${arg}`);
	process.exit(1);
}

pkg.overrides = {
	vite: `^${arg}.0.0`,
	"@vitejs/plugin-react": reactPluginVersion,
	...overrides,
};

fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, "\t")}\n`);
console.log(
	`Successfully added overrides for Vite ${arg} and @vitejs/plugin-react ${reactPluginVersion}`,
);
