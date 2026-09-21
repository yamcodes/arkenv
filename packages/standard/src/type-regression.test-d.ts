import { describe, expectTypeOf, it } from "vitest";
import type { StandardEnvConfig } from ".";

describe("Type Regression (Issue #1912)", () => {
	it("does not expose reserved safe on StandardEnvConfig", () => {
		expectTypeOf<StandardEnvConfig>().not.toHaveProperty("safe");
	});
});
