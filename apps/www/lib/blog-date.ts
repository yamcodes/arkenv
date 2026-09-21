import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type BlogDateGitRunner = (args: string[], cwd: string) => string | null;

export type BlogDateOptions = {
	cwd?: string;
	execGit?: BlogDateGitRunner;
	/** Fallback when git history is missing (untracked / shallow clone). */
	statMtime?: (filePath: string) => Date;
};

const cache = new Map<string, Date | null>();

/** Clear the in-process git-date cache (tests). */
export function clearBlogDateCache(): void {
	cache.clear();
}

function defaultExecGit(args: string[], cwd: string): string | null {
	try {
		const out = execFileSync("git", args, {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
		return out.length > 0 ? out : null;
	} catch {
		return null;
	}
}

function defaultStatMtime(filePath: string): Date {
	return fs.statSync(filePath).mtime;
}

function parseGitDate(raw: string | null): Date | null {
	if (!raw) return null;
	// `git log` may print multiple lines; take the first.
	const line = raw.split("\n", 1)[0]?.trim();
	if (!line) return null;
	const date = new Date(line);
	return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Publish date from git: the commit that added the file.
 * Falls back to the latest commit that touched it (shallow clones).
 */
export function getBlogFileCommitDate(
	filePath: string,
	options: BlogDateOptions = {},
): Date | null {
	const cwd = options.cwd ?? process.cwd();
	const absolute = path.isAbsolute(filePath)
		? filePath
		: path.resolve(cwd, filePath);
	const cached = cache.get(absolute);
	if (cached !== undefined) return cached;

	const relative = path.relative(cwd, absolute);
	const execGit = options.execGit ?? defaultExecGit;

	const created = parseGitDate(
		execGit(
			[
				"log",
				"--diff-filter=A",
				"--follow",
				"--format=%aI",
				"-1",
				"--",
				relative,
			],
			cwd,
		),
	);
	const date =
		created ??
		parseGitDate(execGit(["log", "-1", "--format=%aI", "--", relative], cwd));

	cache.set(absolute, date);
	return date;
}

/**
 * Blog post date: explicit frontmatter `date` wins; otherwise the file's
 * git commit date (first add, with last-touch / mtime fallbacks).
 */
export function resolveBlogPostDate(
	frontmatterDate: string | Date | undefined,
	filePath: string,
	options: BlogDateOptions = {},
): Date {
	if (frontmatterDate !== undefined) {
		return typeof frontmatterDate === "string"
			? new Date(frontmatterDate)
			: frontmatterDate;
	}

	const fromGit = getBlogFileCommitDate(filePath, options);
	if (fromGit) return fromGit;

	const cwd = options.cwd ?? process.cwd();
	const absolute = path.isAbsolute(filePath)
		? filePath
		: path.resolve(cwd, filePath);
	const statMtime = options.statMtime ?? defaultStatMtime;
	return statMtime(absolute);
}
