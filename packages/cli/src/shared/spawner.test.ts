import { describe, expect, it } from "vitest";
import { resolveDlxCommand } from "./spawner";

describe("spawner", () => {
	describe("resolveDlxCommand", () => {
		it("resolves pnpm dlx when user agent contains pnpm", () => {
			const res = resolveDlxCommand(
				"@arkenv/cli",
				["init", "--strict"],
				"pnpm/9.0.0 npm/? node/v22.0.0 darwin arm64",
			);
			expect(res).toEqual({
				command: "pnpm",
				dlxArgs: ["dlx", "@arkenv/cli@latest", "init", "--strict"],
			});
		});

		it("resolves bunx when user agent contains bun", () => {
			const res = resolveDlxCommand(
				"@arkenv/cli",
				["init", "--strict"],
				"bun/1.1.0 npm/? node/v22.0.0 darwin arm64",
			);
			expect(res).toEqual({
				command: "bunx",
				dlxArgs: ["@arkenv/cli@latest", "init", "--strict"],
			});
		});

		it("resolves yarn dlx when user agent contains yarn", () => {
			const res = resolveDlxCommand(
				"@arkenv/cli",
				["init", "--strict"],
				"yarn/4.0.0 npm/? node/v22.0.0 darwin arm64",
			);
			expect(res).toEqual({
				command: "yarn",
				dlxArgs: ["dlx", "@arkenv/cli@latest", "init", "--strict"],
			});
		});

		it("falls back to npx when user agent is npm or empty/missing", () => {
			const resNpm = resolveDlxCommand(
				"@arkenv/cli",
				["init", "--strict"],
				"npm/10.0.0 node/v22.0.0 darwin arm64",
			);
			expect(resNpm).toEqual({
				command: "npx",
				dlxArgs: ["@arkenv/cli@latest", "init", "--strict"],
			});

			const resEmpty = resolveDlxCommand("@arkenv/cli", ["init"], "");
			expect(resEmpty).toEqual({
				command: "npx",
				dlxArgs: ["@arkenv/cli@latest", "init"],
			});
		});
	});
});
