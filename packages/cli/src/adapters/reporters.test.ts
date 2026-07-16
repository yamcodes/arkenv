import { beforeEach, describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "@/shared/errors";
import {
	JsonReporter,
	MemoryReporter,
	SilentReporter,
	TextReporter,
} from "./reporters";

// Force colors for testing consistent output
process.env.FORCE_COLOR = "1";

describe("Reporters", () => {
	let stdoutSpy: any;
	let stderrSpy: any;
	let exitSpy: any;

	beforeEach(() => {
		stdoutSpy = vi
			.spyOn(process.stdout, "write")
			.mockImplementation((_str: any, cb?: any) => {
				if (typeof cb === "function") cb();
				return true;
			});
		stderrSpy = vi
			.spyOn(process.stderr, "write")
			.mockImplementation((_str: any, cb?: any) => {
				if (typeof cb === "function") cb();
				return true;
			});
		exitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);
	});

	describe("TextReporter", () => {
		const reporter = new TextReporter();

		it("logs info to stdout", () => {
			reporter.info("hello");
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining("ℹ hello"),
			);
		});

		it("logs warn to stderr", () => {
			reporter.warn("watch out");
			expect(stderrSpy).toHaveBeenCalledWith(
				expect.stringContaining("⚠ watch out"),
			);
		});

		it("logs error to stderr", () => {
			reporter.error("oh no");
			expect(stderrSpy).toHaveBeenCalledWith(
				expect.stringContaining("✘ oh no"),
			);
		});

		it("logs success to stdout", () => {
			reporter.success("yay");
			expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("✔ yay"));
		});

		it("logs json to stdout", () => {
			reporter.json({ foo: "bar" });
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining('"foo": "bar"'),
			);
		});

		it("cancel logs to stderr", () => {
			reporter.cancel("canceled");
			expect(stderrSpy).toHaveBeenCalledWith(
				expect.stringContaining("✘ canceled"),
			);
			expect(exitSpy).not.toHaveBeenCalled();
		});

		it("fatal logs to stderr and throws", () => {
			expect(() => reporter.fatal("fatal error")).toThrow("fatal error");
			expect(stderrSpy).toHaveBeenCalledWith(
				expect.stringContaining("✘ fatal error"),
			);
		});

		it("refuse is a no-op for human output (no stdout/stderr writes)", () => {
			reporter.refuse({
				code: ERROR_CODES.GIT_TREE_DIRTY,
				message: "Git working tree is not clean.",
				retryWith: ["--force"],
			});
			expect(stdoutSpy).not.toHaveBeenCalled();
			expect(stderrSpy).not.toHaveBeenCalled();
		});
	});

	describe("JsonReporter", () => {
		const reporter = new JsonReporter();

		it("logs info to stderr", () => {
			reporter.info("hello");
			expect(stderrSpy).toHaveBeenCalledWith(
				expect.stringContaining("ℹ hello"),
			);
		});

		it("logs success to stderr", () => {
			reporter.success("yay");
			expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("✔ yay"));
		});

		it("logs json to stdout", () => {
			reporter.json({ foo: "bar" });
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining('"foo": "bar"'),
			);
		});

		it("fatal logs json to stdout and throws", () => {
			expect(() => reporter.fatal("fatal error")).toThrow("fatal error");
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining('"status": "error"'),
			);
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining('"message": "fatal error"'),
			);
		});

		it("fatal carries the generic INTERNAL code and empty retryWith", () => {
			expect(() => reporter.fatal("boom", new Error("kaboom"))).toThrow(
				"kaboom",
			);
			const payload = JSON.parse(stdoutSpy.mock.calls.at(-1)?.[0] as string);
			expect(payload).toEqual({
				status: "error",
				code: ERROR_CODES.INTERNAL,
				message: "boom",
				retryWith: [],
				details: { error: "kaboom" },
			});
		});

		it("refuse logs a structured, coded error payload to stdout", () => {
			reporter.refuse({
				code: ERROR_CODES.REQUIREMENTS_NOT_MET,
				message: "Technical requirements not met.",
				retryWith: ["--force"],
				details: {
					requirements: [
						{
							requirement: "Node.js Version",
							message: "Node.js version must be >= 22.0.0",
							current: "20.0.0",
							expected: ">= 22.0.0",
						},
					],
				},
			});
			const payload = JSON.parse(stdoutSpy.mock.calls.at(-1)?.[0] as string);
			expect(payload).toEqual({
				status: "error",
				code: ERROR_CODES.REQUIREMENTS_NOT_MET,
				message: "Technical requirements not met.",
				retryWith: ["--force"],
				details: {
					requirements: [
						{
							requirement: "Node.js Version",
							message: "Node.js version must be >= 22.0.0",
							current: "20.0.0",
							expected: ">= 22.0.0",
						},
					],
				},
			});
		});

		it("refuse omits details when none are provided", () => {
			reporter.refuse({
				code: ERROR_CODES.GIT_TREE_DIRTY,
				message: "Git working tree is not clean.",
				retryWith: ["--force"],
			});
			const payload = JSON.parse(stdoutSpy.mock.calls.at(-1)?.[0] as string);
			expect(payload).toEqual({
				status: "error",
				code: ERROR_CODES.GIT_TREE_DIRTY,
				message: "Git working tree is not clean.",
				retryWith: ["--force"],
			});
			expect(payload).not.toHaveProperty("details");
		});

		it("cancel logs json to stdout", () => {
			reporter.cancel("cancelled");
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining('"status": "cancelled"'),
			);
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining('"message": "cancelled"'),
			);
			expect(exitSpy).not.toHaveBeenCalled();
		});
	});

	describe("SilentReporter", () => {
		const reporter = new SilentReporter();

		it("does not log info", () => {
			reporter.info("hello");
			expect(stdoutSpy).not.toHaveBeenCalled();
			expect(stderrSpy).not.toHaveBeenCalled();
		});

		it("logs essential info with log()", () => {
			reporter.log("essential");
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining("essential"),
			);
		});

		it("still logs json to stdout", () => {
			reporter.json({ foo: "bar" });
			expect(stdoutSpy).toHaveBeenCalledWith(
				expect.stringContaining('"foo": "bar"'),
			);
		});
	});

	describe("MemoryReporter", () => {
		let reporter: MemoryReporter;

		beforeEach(() => {
			reporter = new MemoryReporter();
		});

		it("stores logs in memory", () => {
			reporter.info("hello");
			reporter.warn("watch out");
			reporter.success("yay");
			reporter.json({ foo: "bar" });

			expect(reporter.logs).toHaveLength(4);
			expect(reporter.logs[0]).toEqual({ type: "info", message: "hello" });
			expect(reporter.logs[1]).toEqual({ type: "warn", message: "watch out" });
			expect(reporter.logs[2]).toEqual({ type: "success", message: "yay" });
			expect(reporter.logs[3]).toEqual({
				type: "json",
				message: JSON.stringify({ foo: "bar" }),
				data: { foo: "bar" },
			});
		});

		it("records refusals with their structured payload", () => {
			const refusal = {
				code: ERROR_CODES.NON_EMPTY_DIR,
				message: "Directory is not empty and no package.json was found.",
				retryWith: ["--force"],
			};
			reporter.refuse(refusal);

			expect(reporter.logs).toHaveLength(1);
			expect(reporter.logs[0]).toEqual({
				type: "refuse",
				message: refusal.message,
				data: refusal,
			});
		});
	});
});
