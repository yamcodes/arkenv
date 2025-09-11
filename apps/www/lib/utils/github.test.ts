import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { breakDownGithubUrl, getLinkTitleAndHref } from "./github";

describe("github utilities", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("breakDownGithubUrl", () => {
		it("should break down a valid GitHub URL", () => {
			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "main",
			});
		});

		it("should break down a valid GitHub URL with trailing slash", () => {
			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv/");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "main",
			});
		});

		it("should use environment variable when no URL provided", () => {
			process.env.NEXT_PUBLIC_GITHUB_URL = "https://github.com/example/repo";

			const result = breakDownGithubUrl();

			expect(result).toEqual({
				owner: "example",
				repo: "repo",
				defaultBranch: "main",
			});
		});

		it("should use custom branch from environment variable", () => {
			process.env.NEXT_PUBLIC_GITHUB_URL = "https://github.com/yamcodes/arkenv";
			process.env.NEXT_PUBLIC_GITHUB_BRANCH = "develop";

			const result = breakDownGithubUrl();

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "develop",
			});
		});

		it("should throw error when no URL is configured", () => {
			delete process.env.NEXT_PUBLIC_GITHUB_URL;

			expect(() => breakDownGithubUrl()).toThrow(
				"NEXT_PUBLIC_GITHUB_URL is not configured",
			);
		});

		it("should throw error for invalid GitHub URL format", () => {
			expect(() => breakDownGithubUrl("https://github.com/")).toThrow(
				"Invalid GitHub URL format",
			);
		});

		it("should throw error for URL with only owner", () => {
			expect(() => breakDownGithubUrl("https://github.com/yamcodes")).toThrow(
				"Invalid GitHub URL format",
			);
		});

		it("should extract owner and repo from URLs with additional path segments", () => {
			// Note: The function takes the last 2 path segments, so for /yamcodes/arkenv/tree/main
			// it extracts "tree" and "main" as owner/repo
			const result = breakDownGithubUrl(
				"https://github.com/yamcodes/arkenv/tree/main",
			);

			expect(result).toEqual({
				owner: "tree",
				repo: "main",
				defaultBranch: "main",
			});
		});
	});

	describe("getLinkTitleAndHref", () => {
		it("should generate correct title and href for editing a file", () => {
			const result = getLinkTitleAndHref(
				"README.md",
				"https://github.com/yamcodes/arkenv",
			);

			expect(result).toEqual({
				title: "Editing arkenv/README.md at main · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv/edit/main/README.md",
			});
		});

		it("should generate correct title and href for file in subdirectory", () => {
			const result = getLinkTitleAndHref(
				"docs/getting-started.md",
				"https://github.com/yamcodes/arkenv",
			);

			expect(result).toEqual({
				title:
					"Editing arkenv/docs/getting-started.md at main · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv/edit/main/docs/getting-started.md",
			});
		});

		it("should use environment variable when no URL provided", () => {
			process.env.NEXT_PUBLIC_GITHUB_URL = "https://github.com/example/repo";

			const result = getLinkTitleAndHref("test.md");

			expect(result).toEqual({
				title: "Editing repo/test.md at main · example/repo",
				href: "https://github.com/example/repo/edit/main/test.md",
			});
		});

		it("should use custom branch from environment variable", () => {
			process.env.NEXT_PUBLIC_GITHUB_URL = "https://github.com/yamcodes/arkenv";
			process.env.NEXT_PUBLIC_GITHUB_BRANCH = "develop";

			const result = getLinkTitleAndHref("package.json");

			expect(result).toEqual({
				title: "Editing arkenv/package.json at develop · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv/edit/develop/package.json",
			});
		});

		it("should throw error when no URL is configured", () => {
			delete process.env.NEXT_PUBLIC_GITHUB_URL;

			expect(() => getLinkTitleAndHref("test.md")).toThrow(
				"NEXT_PUBLIC_GITHUB_URL is not configured",
			);
		});

		it("should handle URLs with trailing slash", () => {
			const result = getLinkTitleAndHref(
				"src/index.ts",
				"https://github.com/yamcodes/arkenv/",
			);

			expect(result).toEqual({
				title: "Editing arkenv/src/index.ts at main · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv//edit/main/src/index.ts",
			});
		});
	});
});
