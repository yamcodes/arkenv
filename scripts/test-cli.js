#!/usr/bin/env node
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cancel, intro, isCancel, select } from "@clack/prompts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Force pnpm to allow installing packages in workspace subfolders when testing
process.env.NPM_CONFIG_IGNORE_WORKSPACE_ROOT_CHECK = "true";

let mode = process.argv[2];

if (!mode) {
	intro("ArkEnv CLI Local Testing Utility");
	const answer = await select({
		message: "Which workflow would you like to test?",
		options: [
			{
				value: "--existing",
				label:
					"Existing Project Flow (with package.json, tsconfig.json, .env.example)",
			},
			{
				value: "--new",
				label: "New Project Flow (completely empty directory)",
			},
		],
	});

	if (isCancel(answer)) {
		cancel("Operation cancelled.");
		process.exit(0);
	}
	mode = answer;
}

if (mode !== "--new" && mode !== "--existing") {
	console.error("Usage: node scripts/test-cli.js [--new | --existing]");
	process.exit(1);
}

const isNew = mode === "--new";
const suffix = crypto.randomBytes(2).toString("hex");
const tempDirName = isNew ? `new-${suffix}` : `existing-${suffix}`;
const tempDir = path.resolve(rootDir, "tmp", tempDirName);

// 1. Build the CLI
console.log("Building arkenv (CLI)...");
execSync("pnpm --filter=arkenv build", { cwd: rootDir, stdio: "inherit" });

// 2. Prepare the directory
console.log(`Preparing temporary directory: ${tempDir}`);
if (fs.existsSync(tempDir)) {
	fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Write .npmrc to prevent pnpm from complaining about workspace root installation
fs.writeFileSync(
	path.join(tempDir, ".npmrc"),
	"ignore-workspace-root-check=true\n",
);

// Write a dummy pnpm-workspace.yaml to isolate the playground from the parent monorepo workspace
fs.writeFileSync(path.join(tempDir, "pnpm-workspace.yaml"), "packages: []\n");

// Change current working directory to the temporary directory
process.chdir(tempDir);

if (isNew) {
	// Setup a minimal package.json to isolate package installation inside this playground
	const packageJson = {
		name: "test-new-project",
		private: true,
	};
	fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
} else {
	// Setup existing project without ArkEnv
	console.log(
		"Setting up existing project files (package.json, tsconfig.json, .env.example)...",
	);

	const packageJson = {
		name: "test-existing-project",
		version: "1.0.0",
		private: true,
		dependencies: {
			react: "^19.0.0",
		},
		devDependencies: {
			typescript: "^5.0.0",
		},
	};
	fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

	const tsconfigJson = {
		compilerOptions: {
			target: "ESNext",
			module: "ESNext",
			moduleResolution: "bundler",
			strict: true,
		},
	};
	fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfigJson, null, 2));

	// Add an example .env.example file to test key detection
	const envExampleContent =
		"PORT=8000\nDATABASE_URL=postgresql://localhost:5432/mydb\n";
	fs.writeFileSync(".env.example", envExampleContent);
}

// Clean up all npm/pnpm lifecycle environment variables to isolate nested calls
for (const key of Object.keys(process.env)) {
	const lowerKey = key.toLowerCase();
	if (
		lowerKey.startsWith("npm_") ||
		lowerKey.startsWith("pnpm_") ||
		lowerKey === "init_cwd"
	) {
		delete process.env[key];
	}
}

// Explicitly set the configuration bypass settings so that pnpm allows running inside the subfolder
process.env.pnpm_config_ignore_workspace_root_check = "true";
process.env.NPM_CONFIG_IGNORE_WORKSPACE_ROOT_CHECK = "true";

// 3. Run the CLI
const extraArgs = process.argv.slice(process.argv[2] === mode ? 3 : 2);
console.log(`Running arkenv init inside ${tempDir}...\n`);
try {
	execSync(
		`node ${path.resolve(rootDir, "packages/arkenv/dist/index.cjs")} init ${extraArgs.join(" ")}`,
		{
			cwd: tempDir,
			stdio: "inherit",
		},
	);
	console.log(
		"\nCLI execution completed. You can inspect the generated files at:",
	);
	console.log(tempDir);
} catch (error) {
	console.error("\nCLI execution failed:", error.message);
	process.exit(1);
}
