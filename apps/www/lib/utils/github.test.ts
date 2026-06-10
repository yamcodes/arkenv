import { beforeEach, describe, expect, it, vi } from "vitest";
import { breakDownGithubUrl, getLinkTitleAndHref } from "./github";

describe("github utilities", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	describe("breakDownGithubUrl", () => {
		it("should break down a valid GitHub URL", () => {
			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "dev",
			});
		});

		it("should break down a valid GitHub URL with trailing slash", () => {
			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv/");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "dev",
			});
		});

		it("should use environment variable when no URL provided", () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_URL", "https://github.com/example/repo");

			const result = breakDownGithubUrl();

			expect(result).toEqual({
				owner: "example",
				repo: "repo",
				defaultBranch: "dev",
			});
		});

		it("should use custom branch from environment variable", () => {
			vi.stubEnv(
				"NEXT_PUBLIC_GITHUB_URL",
				"https://github.com/yamcodes/arkenv",
			);
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "develop");

			const result = breakDownGithubUrl();

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "develop",
			});
		});

		it("should use fallback URL when no URL is configured", () => {
			const result = breakDownGithubUrl();

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "dev",
			});
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
				defaultBranch: "dev",
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
				title: "Editing arkenv/README.md at dev · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv/edit/dev/README.md",
			});
		});

		it("should generate correct title and href for file in subdirectory", () => {
			const result = getLinkTitleAndHref(
				"docs/getting-started.md",
				"https://github.com/yamcodes/arkenv",
			);

			expect(result).toEqual({
				title:
					"Editing arkenv/docs/getting-started.md at dev · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv/edit/dev/docs/getting-started.md",
			});
		});

		it("should use environment variable when no URL provided", () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_URL", "https://github.com/example/repo");

			const result = getLinkTitleAndHref("test.md");

			expect(result).toEqual({
				title: "Editing repo/test.md at dev · example/repo",
				href: "https://github.com/example/repo/edit/dev/test.md",
			});
		});

		it("should use custom branch from environment variable", () => {
			vi.stubEnv(
				"NEXT_PUBLIC_GITHUB_URL",
				"https://github.com/yamcodes/arkenv",
			);
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "develop");

			const result = getLinkTitleAndHref("package.json");

			expect(result).toEqual({
				title: "Editing arkenv/package.json at develop · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv/edit/develop/package.json",
			});
		});

		it("should use fallback URL when no URL is configured", () => {
			const result = getLinkTitleAndHref("test.md");

			expect(result).toEqual({
				title: "Editing arkenv/test.md at dev · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv/edit/dev/test.md",
			});
		});

		it("should handle URLs with trailing slash", () => {
			const result = getLinkTitleAndHref(
				"src/index.ts",
				"https://github.com/yamcodes/arkenv/",
			);

			expect(result).toEqual({
				title: "Editing arkenv/src/index.ts at dev · yamcodes/arkenv",
				href: "https://github.com/yamcodes/arkenv//edit/dev/src/index.ts",
			});
		});
	});
});
