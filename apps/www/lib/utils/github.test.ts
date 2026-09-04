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

		it("should use environment variable when no URL provided", async () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_URL", "https://github.com/example/repo");
			const { breakDownGithubUrl } = await import("./github");

			const result = breakDownGithubUrl();

			expect(result).toEqual({
				owner: "example",
				repo: "repo",
				defaultBranch: "dev",
			});
		});

		it("should use custom branch from environment variable", async () => {
			vi.stubEnv(
				"NEXT_PUBLIC_GITHUB_URL",
				"https://github.com/yamcodes/arkenv",
			);
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "develop");
			const { breakDownGithubUrl } = await import("./github");

			const result = breakDownGithubUrl();

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "develop",
			});
		});

		it("should use Vercel deploy branch when no manual branch override", async () => {
			vi.stubEnv("VERCEL_GIT_COMMIT_REF", "v1");
			const { breakDownGithubUrl } = await import("./github");

			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "v1",
			});
		});

		it("should prefer NEXT_PUBLIC_GITHUB_BRANCH over Vercel deploy branch", async () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "dev");
			vi.stubEnv("VERCEL_GIT_COMMIT_REF", "simplify-docs");
			const { breakDownGithubUrl } = await import("./github");

			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "dev",
			});
		});

		it("should ignore blank NEXT_PUBLIC_GITHUB_BRANCH and use Vercel deploy branch", async () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "");
			vi.stubEnv("VERCEL_GIT_COMMIT_REF", "simplify-docs");
			const { breakDownGithubUrl } = await import("./github");

			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "simplify-docs",
			});
		});

		it("should ignore blank branch env vars and fall back to dev", () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "   ");
			vi.stubEnv("VERCEL_GIT_COMMIT_REF", "");

			const result = breakDownGithubUrl("https://github.com/yamcodes/arkenv");

			expect(result).toEqual({
				owner: "yamcodes",
				repo: "arkenv",
				defaultBranch: "dev",
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

		it("should use fallback URL when NEXT_PUBLIC_GITHUB_URL is blank", () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_URL", "");

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

		it("should use environment variable when no URL provided", async () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_URL", "https://github.com/example/repo");
			const { getLinkTitleAndHref } = await import("./github");

			const result = getLinkTitleAndHref("test.md");

			expect(result).toEqual({
				title: "Editing repo/test.md at dev · example/repo",
				href: "https://github.com/example/repo/edit/dev/test.md",
			});
		});

		it("should use custom branch from environment variable", async () => {
			vi.stubEnv(
				"NEXT_PUBLIC_GITHUB_URL",
				"https://github.com/yamcodes/arkenv",
			);
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "develop");
			const { getLinkTitleAndHref } = await import("./github");

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
				href: "https://github.com/yamcodes/arkenv/edit/dev/src/index.ts",
			});
		});

		it("should not produce a double slash when branch env is blank", () => {
			vi.stubEnv("NEXT_PUBLIC_GITHUB_BRANCH", "");
			vi.stubEnv("VERCEL_GIT_COMMIT_REF", "");

			const result = getLinkTitleAndHref(
				"apps/www/content/docs/index.mdx",
				"https://github.com/yamcodes/arkenv",
			);

			expect(result.href).toBe(
				"https://github.com/yamcodes/arkenv/edit/dev/apps/www/content/docs/index.mdx",
			);
		});

		it("should strip a leading slash from the file path", () => {
			const result = getLinkTitleAndHref(
				"/apps/www/content/docs/index.mdx",
				"https://github.com/yamcodes/arkenv",
			);

			expect(result.href).toBe(
				"https://github.com/yamcodes/arkenv/edit/dev/apps/www/content/docs/index.mdx",
			);
		});
	});
});
