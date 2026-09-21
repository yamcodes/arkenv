import { afterEach, describe, expect, it } from "vitest";

import {
	clearBlogDateCache,
	getBlogFileCommitDate,
	isShallowGitRepository,
	resolveBlogPostDate,
} from "./blog-date";

describe("isShallowGitRepository", () => {
	afterEach(() => {
		clearBlogDateCache();
	});

	it("returns true when git reports a shallow checkout", () => {
		expect(
			isShallowGitRepository("/repo", (args) => {
				expect(args).toEqual(["rev-parse", "--is-shallow-repository"]);
				return "true";
			}),
		).toBe(true);
	});

	it("returns false for a full-history checkout", () => {
		expect(isShallowGitRepository("/repo", () => "false")).toBe(false);
	});

	it("caches the shallow check per cwd", () => {
		let runs = 0;
		const execGit = () => {
			runs += 1;
			return "true";
		};
		expect(isShallowGitRepository("/repo", execGit)).toBe(true);
		expect(isShallowGitRepository("/repo", execGit)).toBe(true);
		expect(runs).toBe(1);
	});
});

describe("getBlogFileCommitDate", () => {
	afterEach(() => {
		clearBlogDateCache();
	});

	it("prefers the commit that added the file on a full-history checkout", () => {
		const calls: string[][] = [];
		const date = getBlogFileCommitDate("/repo/content/blog/hello.mdx", {
			cwd: "/repo",
			execGit: (args) => {
				calls.push(args);
				if (args.includes("--is-shallow-repository")) return "false";
				if (args.includes("--diff-filter=A")) {
					return "2026-09-04T17:10:55+05:00";
				}
				return "2026-09-21T10:04:11+05:00";
			},
		});

		expect(date?.toISOString()).toBe(
			new Date("2026-09-04T17:10:55+05:00").toISOString(),
		);
		expect(calls.some((args) => args.includes("--diff-filter=A"))).toBe(true);
		expect(
			calls.some(
				(args) => args[0] === "log" && !args.includes("--diff-filter=A"),
			),
		).toBe(false);
	});

	it("skips the first-add lookup on a shallow checkout", () => {
		const calls: string[][] = [];
		const date = getBlogFileCommitDate("/repo/content/blog/hello.mdx", {
			cwd: "/repo",
			execGit: (args) => {
				calls.push(args);
				if (args.includes("--is-shallow-repository")) return "true";
				if (args.includes("--diff-filter=A")) {
					return "2026-09-20T12:00:00+00:00";
				}
				return "2026-09-21T10:04:11+05:00";
			},
		});

		expect(date?.toISOString()).toBe(
			new Date("2026-09-21T10:04:11+05:00").toISOString(),
		);
		expect(calls.some((args) => args.includes("--diff-filter=A"))).toBe(false);
		expect(
			calls.some(
				(args) =>
					args[0] === "log" &&
					args.includes("-1") &&
					args.includes("--format=%aI"),
			),
		).toBe(true);
	});

	it("falls back to the latest commit when the add commit is missing", () => {
		const date = getBlogFileCommitDate("/repo/content/blog/hello.mdx", {
			cwd: "/repo",
			execGit: (args) => {
				if (args.includes("--is-shallow-repository")) return "false";
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
				execGit: (args) => {
					if (args.includes("--is-shallow-repository")) return "false";
					return null;
				},
			}),
		).toBeNull();
	});

	it("caches by absolute path", () => {
		let logRuns = 0;
		const options = {
			cwd: "/repo",
			execGit: (args: string[]) => {
				if (args.includes("--is-shallow-repository")) return "false";
				logRuns += 1;
				return "2026-09-04T17:10:55+05:00";
			},
		};

		getBlogFileCommitDate("content/blog/hello.mdx", options);
		getBlogFileCommitDate("/repo/content/blog/hello.mdx", options);
		expect(logRuns).toBe(1);
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
			execGit: (args) => {
				if (args.includes("--is-shallow-repository")) return "false";
				return "2026-09-04T17:10:55+05:00";
			},
		});
		expect(date.toISOString()).toBe(
			new Date("2026-09-04T17:10:55+05:00").toISOString(),
		);
	});

	it("falls back to file mtime when git yields nothing", () => {
		const mtime = new Date("2026-03-01T12:00:00.000Z");
		const date = resolveBlogPostDate(undefined, "/repo/post.mdx", {
			cwd: "/repo",
			execGit: (args) => {
				if (args.includes("--is-shallow-repository")) return "false";
				return null;
			},
			statMtime: () => mtime,
		});
		expect(date).toBe(mtime);
	});
});
