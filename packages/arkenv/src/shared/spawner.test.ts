import { describe, expect, it } from "vitest";
import { resolveDlxCommand } from "./spawner";

describe("spawner", () => {
	describe("resolveDlxCommand", () => {
		it("resolves pnpm dlx when user agent contains pnpm", () => {
			const res = resolveDlxCommand(
				"arkenv",
				["init"],
				"pnpm/9.0.0 npm/? node/v22.0.0 darwin arm64",
			);
			expect(res).toEqual({
				command: "pnpm",
				dlxArgs: ["dlx", "arkenv@latest", "init"],
			});
		});

		it("resolves bunx when user agent contains bun", () => {
			const res = resolveDlxCommand(
				"arkenv",
				["init"],
				"bun/1.1.0 npm/? node/v22.0.0 darwin arm64",
			);
			expect(res).toEqual({
				command: "bunx",
				dlxArgs: ["arkenv@latest", "init"],
			});
		});

		it("resolves yarn dlx when user agent contains yarn", () => {
			const res = resolveDlxCommand(
				"arkenv",
				["init"],
				"yarn/4.0.0 npm/? node/v22.0.0 darwin arm64",
			);
			expect(res).toEqual({
				command: "yarn",
				dlxArgs: ["dlx", "arkenv@latest", "init"],
			});
		});

		it("falls back to npx when user agent is npm or empty/missing", () => {
			const resNpm = resolveDlxCommand(
				"arkenv",
				["init"],
				"npm/10.0.0 node/v22.0.0 darwin arm64",
			);
			expect(resNpm).toEqual({
				command: "npx",
				dlxArgs: ["arkenv@latest", "init"],
			});

			const resEmpty = resolveDlxCommand("arkenv", ["init"], "");
			expect(resEmpty).toEqual({
				command: "npx",
				dlxArgs: ["arkenv@latest", "init"],
			});
		});
	});
});
