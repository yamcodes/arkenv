import { afterEach, describe, expect, it } from "vitest";

import {
	clearBlogDateCache,
	getBlogFileCommitDate,
	resolveBlogPostDate,
} from "./blog-date";

describe("getBlogFileCommitDate", () => {
	afterEach(() => {
		clearBlogDateCache();
	});

	it("prefers the commit that added the file", () => {
		const calls: string[][] = [];
		const date = getBlogFileCommitDate("/repo/content/blog/hello.mdx", {
			cwd: "/repo",
			execGit: (args) => {
				calls.push(args);
				if (args.includes("--diff-filter=A")) {
					return "2026-09-04T17:10:55+05:00";
				}
				return "2026-09-21T10:04:11+05:00";
			},
		});

		expect(date?.toISOString()).toBe(
			new Date("2026-09-04T17:10:55+05:00").toISOString(),
		);
		expect(calls[0]).toContain("--diff-filter=A");
		expect(calls).toHaveLength(1);
	});

	it("falls back to the latest commit when the add commit is missing", () => {
		const date = getBlogFileCommitDate("/repo/content/blog/hello.mdx", {
			cwd: "/repo",
			execGit: (args) => {
				if (args.includes("--diff-filter=A")) return null;
				return "2026-09-21T10:04:11+05:00";
			},
		});

		expect(date?.toISOString()).toBe(
			new Date("2026-09-21T10:04:11+05:00").toISOString(),
		);
	});

	it("returns null when git has no history for the file", () => {
		expect(
			getBlogFileCommitDate("/repo/content/blog/new.mdx", {
				cwd: "/repo",
				execGit: () => null,
			}),
		).toBeNull();
	});

	it("caches by absolute path", () => {
		let runs = 0;
		const options = {
			cwd: "/repo",
			execGit: () => {
				runs += 1;
				return "2026-09-04T17:10:55+05:00";
			},
		};

		getBlogFileCommitDate("content/blog/hello.mdx", options);
		getBlogFileCommitDate("/repo/content/blog/hello.mdx", options);
		expect(runs).toBe(1);
	});
});

describe("resolveBlogPostDate", () => {
	afterEach(() => {
		clearBlogDateCache();
	});

	it("uses an explicit frontmatter date override", () => {
		const date = resolveBlogPostDate("2026-01-15", "/repo/post.mdx", {
			cwd: "/repo",
			execGit: () => "2026-09-04T17:10:55+05:00",
		});
		expect(date.toISOString()).toBe(new Date("2026-01-15").toISOString());
	});

	it("accepts a Date frontmatter override", () => {
		const override = new Date("2026-02-01T00:00:00.000Z");
		expect(
			resolveBlogPostDate(override, "/repo/post.mdx", {
				cwd: "/repo",
				execGit: () => "2026-09-04T17:10:55+05:00",
			}),
		).toBe(override);
	});

	it("uses the git commit date when frontmatter omits date", () => {
		const date = resolveBlogPostDate(undefined, "/repo/post.mdx", {
			cwd: "/repo",
			execGit: () => "2026-09-04T17:10:55+05:00",
		});
		expect(date.toISOString()).toBe(
			new Date("2026-09-04T17:10:55+05:00").toISOString(),
		);
	});

	it("falls back to file mtime when git yields nothing", () => {
		const mtime = new Date("2026-03-01T12:00:00.000Z");
		const date = resolveBlogPostDate(undefined, "/repo/post.mdx", {
			cwd: "/repo",
			execGit: () => null,
			statMtime: () => mtime,
		});
		expect(date).toBe(mtime);
	});
});
