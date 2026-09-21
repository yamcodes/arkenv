import { describe, it } from "vitest";
import type { StandardEnvConfig } from ".";

describe("Type Regression (Issue #1912)", () => {
	it("rejects safe on StandardEnvConfig", () => {
		// @ts-expect-error safe is not a config option — use @arkenv/standard/safe
		const rejectFalse: StandardEnvConfig = { safe: false };
		// @ts-expect-error safe is not a config option — use @arkenv/standard/safe
		const rejectTrue: StandardEnvConfig = { safe: true };
		void rejectFalse;
		void rejectTrue;
	});
});
