import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, generateStaticParams } from "./route";

const mockGetLLMText = vi.fn();
const mockGetPage = vi.fn();
const mockGenerateParams = vi.fn();

vi.mock("~/lib/get-llm-text", () => ({
	getLLMText: (page: unknown) => mockGetLLMText(page),
}));

vi.mock("~/lib/source", () => ({
	source: {
		getPage: (slug: string[] | undefined) => mockGetPage(slug),
		generateParams: () => mockGenerateParams(),
	},
}));

vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

const makeRequest = () => new Request("http://localhost/");

const makeParams = (slug: string[] | undefined) =>
	Promise.resolve({ slug });

describe("GET /llms.mdx/docs/[[...slug]]", () => {
	beforeEach(() => {
		mockGetLLMText.mockReset();
		mockGetPage.mockReset();
		mockGenerateParams.mockReset();
		vi.mocked(notFound).mockReset();
		vi.mocked(notFound).mockImplementation(() => {
			throw new Error("NEXT_NOT_FOUND");
		});
	});

	it("returns 200 with text/markdown for a .mdx URL", async () => {
		const fakePage = { data: { title: "Getting Started", getText: vi.fn() } };
		mockGetPage.mockReturnValue(fakePage);
		mockGetLLMText.mockResolvedValue("# Getting Started\n\nContent here.");

		const response = await GET(makeRequest(), {
			params: makeParams(["arkenv", "getting-started.mdx"]),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/markdown");
		expect(await response.text()).toBe("# Getting Started\n\nContent here.");
		// Extension should be stripped before getPage lookup
		expect(mockGetPage).toHaveBeenCalledWith(["arkenv", "getting-started"]);
	});

	it("returns 200 with text/markdown for a .md URL", async () => {
		const fakePage = { data: { title: "Getting Started", getText: vi.fn() } };
		mockGetPage.mockReturnValue(fakePage);
		mockGetLLMText.mockResolvedValue("# Getting Started\n\nContent here.");

		const response = await GET(makeRequest(), {
			params: makeParams(["arkenv", "getting-started.md"]),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/markdown");
		expect(await response.text()).toBe("# Getting Started\n\nContent here.");
		// Extension should be stripped before getPage lookup
		expect(mockGetPage).toHaveBeenCalledWith(["arkenv", "getting-started"]);
	});

	it("calls notFound for a non-existent .md page", async () => {
		mockGetPage.mockReturnValue(undefined);

		await expect(
			GET(makeRequest(), {
				params: makeParams(["nonexistent", "page.md"]),
			}),
		).rejects.toThrow("NEXT_NOT_FOUND");

		expect(notFound).toHaveBeenCalled();
	});

	it("calls notFound for a non-existent .mdx page", async () => {
		mockGetPage.mockReturnValue(undefined);

		await expect(
			GET(makeRequest(), {
				params: makeParams(["nonexistent", "page.mdx"]),
			}),
		).rejects.toThrow("NEXT_NOT_FOUND");

		expect(notFound).toHaveBeenCalled();
	});

	it("works without any extension for bare slug", async () => {
		const fakePage = { data: { title: "Intro", getText: vi.fn() } };
		mockGetPage.mockReturnValue(fakePage);
		mockGetLLMText.mockResolvedValue("# Intro");

		const response = await GET(makeRequest(), {
			params: makeParams(["arkenv", "intro"]),
		});

		expect(response.status).toBe(200);
		expect(mockGetPage).toHaveBeenCalledWith(["arkenv", "intro"]);
	});
});

describe("generateStaticParams", () => {
	it("delegates to source.generateParams()", () => {
		const fakeParams = [{ slug: ["arkenv", "getting-started"] }];
		mockGenerateParams.mockReturnValue(fakeParams);

		const result = generateStaticParams();

		expect(result).toBe(fakeParams);
		expect(mockGenerateParams).toHaveBeenCalledOnce();
	});
});
