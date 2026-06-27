import { beforeEach, describe, expect, it, vi } from "vitest";
import { styleText } from "./style-text";

describe("styleText", () => {
	describe("in Node environment", () => {
		beforeEach(() => {
			// Ensure we're in a Node environment with TTY and no color-disabling env vars
			vi.stubGlobal("process", {
				versions: { node: "22.0.0" },
				env: {},
				stdout: { isTTY: true },
			});
		});

		it("should apply red ANSI color code", () => {
			const result = styleText("red", "error message");
			expect(result).toBe("\x1b[31merror message\x1b[0m");
		});

		it("should apply yellow ANSI color code", () => {
			const result = styleText("yellow", "warning message");
			expect(result).toBe("\x1b[33mwarning message\x1b[0m");
		});

		it("should apply cyan ANSI color code", () => {
			const result = styleText("cyan", "info message");
			expect(result).toBe("\x1b[36minfo message\x1b[0m");
		});

		it("should handle empty strings", () => {
			const result = styleText("red", "");
			expect(result).toBe("\x1b[31m\x1b[0m");
		});

		it("should handle special characters", () => {
			const result = styleText("yellow", "test\n\ttab");
			expect(result).toBe("\x1b[33mtest\n\ttab\x1b[0m");
		});

		it("should handle unicode characters", () => {
			const result = styleText("cyan", "🎉 success");
			expect(result).toBe("\x1b[36m🎉 success\x1b[0m");
		});
	});

	describe("in browser environment", () => {
		beforeEach(() => {
			// Simulate browser environment (no process.versions.node)
			vi.stubGlobal("process", undefined);
		});

		it("should return plain text for red", () => {
			const result = styleText("red", "error message");
			expect(result).toBe("error message");
		});

		it("should return plain text for yellow", () => {
			const result = styleText("yellow", "warning message");
			expect(result).toBe("warning message");
		});

		it("should return plain text for cyan", () => {
			const result = styleText("cyan", "info message");
			expect(result).toBe("info message");
		});

		it("should return plain text for empty strings", () => {
			const result = styleText("red", "");
			expect(result).toBe("");
		});

		it("should preserve special characters", () => {
			const result = styleText("yellow", "test\n\ttab");
			expect(result).toBe("test\n\ttab");
		});

		it("should preserve unicode characters", () => {
			const result = styleText("cyan", "🎉 success");
			expect(result).toBe("🎉 success");
		});
	});

	describe("edge cases", () => {
		it("should handle process.versions being null", () => {
			vi.stubGlobal("process", { versions: null });

			const result = styleText("red", "test");
			expect(result).toBe("test");
		});

		it("should handle process.versions.node being null", () => {
			vi.stubGlobal("process", { versions: { node: null } });

			const result = styleText("red", "test");
			expect(result).toBe("test");
		});

		it("should handle long text", () => {
			vi.stubGlobal("process", {
				versions: { node: "22.0.0" },
				env: {},
				stdout: { isTTY: true },
			});

			const longText = "a".repeat(10000);
			const result = styleText("red", longText);
			expect(result).toBe(`\x1b[31m${longText}\x1b[0m`);
		});
	});

	describe("color disabling", () => {
		it("should disable colors when NO_COLOR is set", () => {
			vi.stubGlobal("process", {
				versions: { node: "22.0.0" },
				env: { NO_COLOR: "1" },
				stdout: { isTTY: true },
			});

			const result = styleText("red", "test");
			expect(result).toBe("test");
		});

		it("should disable colors when CI is set", () => {
			vi.stubGlobal("process", {
				versions: { node: "22.0.0" },
				env: { CI: "true" },
				stdout: { isTTY: true },
			});

			const result = styleText("red", "test");
			expect(result).toBe("test");
		});

		it("should disable colors when not writing to TTY", () => {
			vi.stubGlobal("process", {
				versions: { node: "22.0.0" },
				env: {},
				stdout: { isTTY: false },
			});

			const result = styleText("red", "test");
			expect(result).toBe("test");
		});

		it("should enable colors when all conditions are met", () => {
			vi.stubGlobal("process", {
				versions: { node: "22.0.0" },
				env: {},
				stdout: { isTTY: true },
			});

			const result = styleText("red", "test");
			expect(result).toBe("\x1b[31mtest\x1b[0m");
		});
	});
});
