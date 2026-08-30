import { describe, expect, it, vi } from "vitest";
import { resolveDlxCommand, spawnLatest } from "./spawner";

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

	describe("spawnLatest", () => {
		it("spawns child process and resolves exit code on clean close", async () => {
			const { EventEmitter } = await import("node:events");
			const mockChild = new EventEmitter() as any;
			mockChild.kill = vi.fn();
			const mockSpawn = vi.fn().mockReturnValue(mockChild);

			const promise = spawnLatest({
				packageName: "arkenv",
				args: ["init"],
				userAgent: "npm/10.0.0 node/v22.0.0 darwin arm64",
				spawnFn: mockSpawn as any,
			});

			mockChild.emit("close", 0, null);

			const code = await promise;
			expect(code).toBe(0);
			expect(mockSpawn).toHaveBeenCalledWith(
				"npx",
				["arkenv@latest", "init"],
				expect.objectContaining({ stdio: "inherit" }),
			);
		});

		it("resolves 130 when child is closed with SIGINT signal", async () => {
			const { EventEmitter } = await import("node:events");
			const mockChild = new EventEmitter() as any;
			mockChild.kill = vi.fn();
			const mockSpawn = vi.fn().mockReturnValue(mockChild);

			const promise = spawnLatest({
				packageName: "arkenv",
				args: ["init"],
				spawnFn: mockSpawn as any,
			});

			mockChild.emit("close", null, "SIGINT");

			const code = await promise;
			expect(code).toBe(130);
		});

		it("resolves 143 when child is closed with SIGTERM signal", async () => {
			const { EventEmitter } = await import("node:events");
			const mockChild = new EventEmitter() as any;
			mockChild.kill = vi.fn();
			const mockSpawn = vi.fn().mockReturnValue(mockChild);

			const promise = spawnLatest({
				packageName: "arkenv",
				args: ["init"],
				spawnFn: mockSpawn as any,
			});

			mockChild.emit("close", null, "SIGTERM");

			const code = await promise;
			expect(code).toBe(143);
		});

		it("rejects when child process errors", async () => {
			const { EventEmitter } = await import("node:events");
			const mockChild = new EventEmitter() as any;
			mockChild.kill = vi.fn();
			const mockSpawn = vi.fn().mockReturnValue(mockChild);

			const promise = spawnLatest({
				packageName: "arkenv",
				args: ["init"],
				spawnFn: mockSpawn as any,
			});

			const error = new Error("spawn ENOENT");
			mockChild.emit("error", error);

			await expect(promise).rejects.toThrow("spawn ENOENT");
		});
	});
});
