import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Check if a path should be excluded
 */
export function shouldExclude(name, excludes) {
	return excludes.some((pattern) => {
		if (pattern.includes("*")) {
			// Simple glob matching
			const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
			return regex.test(name);
		}
		return name === pattern;
	});
}

/**
 * Copy directory recursively with exclusions
 */
export function copyDirectory(src, dest, excludes) {
	if (!existsSync(dest)) {
		mkdirSync(dest, { recursive: true });
	}

	const entries = readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		if (shouldExclude(entry.name, excludes)) {
			continue;
		}

		const srcPath = join(src, entry.name);
		const destPath = join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDirectory(srcPath, destPath, excludes);
		} else {
			cpSync(srcPath, destPath);
		}
	}
}

/**
 * Get all files in a directory recursively
 */
export function getAllFiles(dir, excludes = [], basePath = dir) {
	const files = [];

	if (!existsSync(dir)) return files;

	const entries = readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		if (shouldExclude(entry.name, excludes)) {
			continue;
		}

		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...getAllFiles(fullPath, excludes, basePath));
		} else {
			files.push(relative(basePath, fullPath));
		}
	}

	return files;
}

/**
 * Compare two files and return if they're identical
 */
export function filesAreIdentical(file1, file2) {
	if (!existsSync(file1) || !existsSync(file2)) {
		return false;
	}

	const content1 = readFileSync(file1);
	const content2 = readFileSync(file2);

	return content1.equals(content2);
}
