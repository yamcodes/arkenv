import { describe, expect, it } from "vitest";
import { getDlxCommand } from "./scaffold";

describe("scaffold", () => {
	describe("getDlxCommand", () => {
		it("returns correct command for pnpm", () => {
			expect(getDlxCommand("pnpm")).toEqual(["pnpm", "dlx"]);
		});
		it("returns correct command for npm", () => {
			expect(getDlxCommand("npm")).toEqual(["npx"]);
		});
		it("returns correct command for yarn", () => {
			expect(getDlxCommand("yarn")).toEqual(["yarn", "dlx"]);
		});
		it("returns correct command for bun", () => {
			expect(getDlxCommand("bun")).toEqual(["bunx"]);
		});
	});
});
