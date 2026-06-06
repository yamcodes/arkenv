import { beforeEach, describe, expect, it, vi } from "vitest";
import Image, { alt, contentType, size } from "./opengraph-image";

const mockGenerateOGImage = vi.fn();

vi.mock("fumadocs-ui/og", () => ({
	generateOGImage: (options: any) => mockGenerateOGImage(options),
}));

describe("homepage opengraph-image", () => {
	beforeEach(() => {
		mockGenerateOGImage.mockReset();
		mockGenerateOGImage.mockReturnValue(
			new Response("mocked image", {
				status: 200,
				headers: { "content-type": "image/png" },
			}),
		);
	});

	it("should export correct metadata", () => {
		expect(alt).toBe("ArkEnv");
		expect(contentType).toBe("image/png");
		expect(size).toEqual({ width: 1200, height: 630 });
	});

	it("should generate OG image for homepage", async () => {
		const response = await Image();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/png");

		expect(mockGenerateOGImage).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "ArkEnv",
				description: "Environment variable validation from editor to runtime",
				site: "arkenv.js.org",
				primaryTextColor: "rgb(59, 130, 246)",
			}),
		);
	});
});
