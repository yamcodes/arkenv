import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageRoot = resolve(__dirname, "..");
const repoRoot = resolve(packageRoot, "../..");

const addonDir = resolve(packageRoot, ".add-on");
const assetsDir = resolve(addonDir, "assets");
const distDir = resolve(packageRoot, "dist");
const docsPublicDir = resolve(repoRoot, "apps/www/public/tanstack");

function gatherFilesRecursively(
	dir: string,
	baseDir: string,
): Record<string, string> {
	const result: Record<string, string> = {};
	if (!existsSync(dir)) return result;

	const entries = readdirSync(dir);
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			Object.assign(result, gatherFilesRecursively(fullPath, baseDir));
		} else if (stat.isFile()) {
			const relPath = relative(baseDir, fullPath).replace(/\\/g, "/");
			result[relPath] = readFileSync(fullPath, "utf-8");
		}
	}
	return result;
}

export function buildAddon() {
	console.log("Building @arkenv/tanstack-addon...");

	const infoPath = join(addonDir, "info.json");
	const packageTemplatePath = join(addonDir, "package.json.ejs");

	if (!existsSync(infoPath)) {
		throw new Error(`Missing ${infoPath}`);
	}
	if (!existsSync(packageTemplatePath)) {
		throw new Error(`Missing ${packageTemplatePath}`);
	}

	const info = JSON.parse(readFileSync(infoPath, "utf-8"));
	const packageTemplate = readFileSync(packageTemplatePath, "utf-8");

	const files = gatherFilesRecursively(assetsDir, assetsDir);

	const compiled = {
		...info,
		packageTemplate,
		files,
		deletedFiles: [],
	};

	// Ensure distDir exists
	mkdirSync(distDir, { recursive: true });
	const compiledJson = JSON.stringify(compiled, null, 2);

	// Write to package dist
	writeFileSync(join(distDir, "info.json"), compiledJson);
	writeFileSync(join(distDir, "add-on.json"), compiledJson);

	// Sync to apps/www/public/tanstack
	mkdirSync(docsPublicDir, { recursive: true });
	writeFileSync(join(docsPublicDir, "info.json"), compiledJson);
	writeFileSync(join(docsPublicDir, "add-on.json"), compiledJson);
	writeFileSync(join(docsPublicDir, "package.json.ejs"), packageTemplate);

	// Copy assets directory recursively to apps/www/public/tanstack/assets
	const targetAssetsDir = join(docsPublicDir, "assets");
	mkdirSync(targetAssetsDir, { recursive: true });
	cpSync(assetsDir, targetAssetsDir, { recursive: true });

	console.log(
		`Successfully compiled ${Object.keys(files).length} asset files into:`,
	);
	console.log(` - ${join(distDir, "info.json")}`);
	console.log(` - ${join(docsPublicDir, "info.json")}`);
	console.log(` - ${targetAssetsDir}`);

	return compiled;
}

// Run if called directly
if (process.argv[1] === __filename) {
	buildAddon();
}
