import { describe, expect, it } from "vitest";

describe("server-only protection", () => {
	it("should throw when imported under client/default conditions", async () => {
		await expect(import("./server")).rejects.toThrow(
			"This module cannot be imported from a Client Component module. It should only be used from a Server Component.",
		);
	});
});
