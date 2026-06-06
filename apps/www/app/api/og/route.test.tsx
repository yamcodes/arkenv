import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mockGenerateOGImage = vi.fn();

vi.mock("fumadocs-ui/og", () => ({
	generateOGImage: (options: any) => mockGenerateOGImage(options),
}));

describe("api/og route", () => {
	beforeEach(() => {
		mockGenerateOGImage.mockReset();
		mockGenerateOGImage.mockReturnValue(
			new Response("mocked image", {
				status: 200,
				headers: { "content-type": "image/png" },
			}),
		);
	});

	it("should parse query parameters and generate OG image", async () => {
		const req = new NextRequest(
			"https://arkenv.js.org/api/og?title=Custom%20Title&description=Custom%20Description",
		);
		const response = await GET(req);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/png");

		expect(mockGenerateOGImage).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Custom Title",
				description: "Custom Description",
				site: "ArkEnv Docs",
				primaryTextColor: "rgb(59, 130, 246)",
			}),
		);
	});

	it("should use default parameters when query parameters are missing", async () => {
		const req = new NextRequest("https://arkenv.js.org/api/og");
		const response = await GET(req);

		expect(response.status).toBe(200);
		expect(mockGenerateOGImage).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "ArkEnv",
				description: "Environment variable validation from editor to runtime",
				site: "ArkEnv Docs",
			}),
		);
	});
});
