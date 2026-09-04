import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("fumadocs-mdx:collections/server", () => ({
	blogPosts: [],
	docs: {
		toFumadocsSource: () => ({
			files: [],
		}),
	},
}));

vi.mock("fumadocs-mdx/runtime/server", () => ({
	toFumadocsSource: () => ({
		files: [],
	}),
}));

vi.mock("fumadocs-core/source", () => ({
	loader: () => ({
		getPages: () => [],
	}),
}));

vi.mock("~/components/ui/new-badge", () => ({
	NewBadge: () => null,
	UpdatedBadge: () => null,
}));

import { isPublishedBlogPage } from "./source";

describe("isPublishedBlogPage", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("includes non-draft pages in production", () => {
		expect(
			isPublishedBlogPage({ data: { draft: false } }, "production"),
		).toBe(true);
		expect(isPublishedBlogPage({ data: {} }, "production")).toBe(true);
	});

	it("excludes draft pages in production", () => {
		expect(
			isPublishedBlogPage({ data: { draft: true } }, "production"),
		).toBe(false);
	});

	it("includes draft pages in development", () => {
		expect(
			isPublishedBlogPage({ data: { draft: true } }, "development"),
		).toBe(true);
	});

	it("uses process.env.NODE_ENV when nodeEnv is omitted", () => {
		vi.stubEnv("NODE_ENV", "production");
		expect(isPublishedBlogPage({ data: { draft: true } })).toBe(false);

		vi.stubEnv("NODE_ENV", "development");
		expect(isPublishedBlogPage({ data: { draft: true } })).toBe(true);
	});
});
