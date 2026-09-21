import { afterEach, describe, expect, it, vi } from "vitest";

import { allowBlogDrafts, isPublishedBlogPage } from "./blog-published";

describe("allowBlogDrafts", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("excludes drafts on Vercel production", () => {
		expect(
			allowBlogDrafts({ VERCEL_ENV: "production", NODE_ENV: "production" }),
		).toBe(false);
	});

	it("includes drafts on Vercel preview even when NODE_ENV is production", () => {
		expect(
			allowBlogDrafts({ VERCEL_ENV: "preview", NODE_ENV: "production" }),
		).toBe(true);
	});

	it("includes drafts on Vercel development", () => {
		expect(
			allowBlogDrafts({ VERCEL_ENV: "development", NODE_ENV: "production" }),
		).toBe(true);
	});

	it("falls back to NODE_ENV when VERCEL_ENV is unset", () => {
		expect(allowBlogDrafts({ NODE_ENV: "development" })).toBe(true);
		expect(allowBlogDrafts({ NODE_ENV: "production" })).toBe(false);
	});

	it("treats blank VERCEL_ENV as unset", () => {
		expect(allowBlogDrafts({ VERCEL_ENV: "  ", NODE_ENV: "development" })).toBe(
			true,
		);
		expect(allowBlogDrafts({ VERCEL_ENV: "", NODE_ENV: "production" })).toBe(
			false,
		);
	});
});

describe("isPublishedBlogPage", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("includes non-draft pages in production", () => {
		expect(
			isPublishedBlogPage(
				{ data: { draft: false } },
				{ VERCEL_ENV: "production", NODE_ENV: "production" },
			),
		).toBe(true);
		expect(
			isPublishedBlogPage(
				{ data: {} },
				{ VERCEL_ENV: "production", NODE_ENV: "production" },
			),
		).toBe(true);
	});

	it("excludes draft pages on Vercel production", () => {
		expect(
			isPublishedBlogPage(
				{ data: { draft: true } },
				{ VERCEL_ENV: "production", NODE_ENV: "production" },
			),
		).toBe(false);
	});

	it("includes draft pages on Vercel preview", () => {
		expect(
			isPublishedBlogPage(
				{ data: { draft: true } },
				{ VERCEL_ENV: "preview", NODE_ENV: "production" },
			),
		).toBe(true);
	});

	it("includes draft pages in local development", () => {
		expect(
			isPublishedBlogPage({ data: { draft: true } }, { NODE_ENV: "development" }),
		).toBe(true);
	});

	it("uses process.env when env is omitted", () => {
		vi.stubEnv("VERCEL_ENV", "production");
		vi.stubEnv("NODE_ENV", "production");
		expect(isPublishedBlogPage({ data: { draft: true } })).toBe(false);

		vi.stubEnv("VERCEL_ENV", "preview");
		expect(isPublishedBlogPage({ data: { draft: true } })).toBe(true);

		vi.unstubAllEnvs();
		vi.stubEnv("NODE_ENV", "development");
		expect(isPublishedBlogPage({ data: { draft: true } })).toBe(true);
	});
});
