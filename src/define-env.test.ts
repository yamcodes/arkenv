import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { defineEnv } from "./define-env";
import { host, port } from "./types";

/**
 * Test if the code does not reach this line
 */
const unreachable = () => expect(true).toBe(false);

describe("defineEnv", () => {
	const originalEnv = { ...process.env };
	const originalExit = process.exit;
	const originalConsoleLog = console.log;
	const originalConsoleError = console.error;
	let exitCode: number | undefined;

	beforeEach(() => {
		// Mock process.exit
		process.exit = ((code?: number) => {
			exitCode = code;
			throw new Error("process.exit");
		}) as (code?: number) => never;

		// Mock console methods to suppress output
		console.log = () => {};
		console.error = () => {};
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		process.exit = originalExit;
		console.log = originalConsoleLog;
		console.error = originalConsoleError;
		exitCode = undefined;
	});

	it("should validate string env variables", () => {
		process.env.TEST_STRING = "hello";

		const env = defineEnv({
			TEST_STRING: "string",
		});

		expect(env.TEST_STRING).toBe("hello");
	});

	it("should validate an ip address", () => {
		process.env.HOST = "127.0.0.1";

		const env = defineEnv({
			HOST: "string.ip",
		});

		expect(env.HOST).toBe("127.0.0.1");
	});

	it("should throw when the ip address is invalid", () => {
		process.env.HOST = "invalid";

		try {
			defineEnv({
				HOST: "string.ip",
			});
			unreachable();
		} catch (error) {
			expect(exitCode).toBe(1);
		}
	});

	it("should validate a port", () => {
		process.env.PORT = "8080";

		const env = defineEnv({
			PORT: port,
		});

		expect(env.PORT).toBe(8080);
	});

	it("should throw when the port is invalid (1)", () => {
		process.env.PORT = "invalid";

		try {
			defineEnv({
				PORT: port,
			});
			unreachable();
		} catch (error) {
			expect(exitCode).toBe(1);
		}
	});

	it("should throw when the port is invalid (2)", () => {
		process.env.PORT = "-2";

		try {
			defineEnv({
				PORT: port,
			});
			unreachable();
		} catch (error) {
			expect(exitCode).toBe(1);
		}
	});

	it("should throw when required env variable is missing", () => {
		try {
			defineEnv({
				MISSING_VAR: "string",
			});
			unreachable();
		} catch (error) {
			expect(exitCode).toBe(1);
		}
	});

	it("should throw when env variable has wrong type", () => {
		process.env.WRONG_TYPE = "not a number";

		try {
			defineEnv({
				WRONG_TYPE: "number",
			});
			unreachable();
		} catch (error) {
			expect(exitCode).toBe(1);
		}
	});

	it("should validate against a custom environment", () => {
		const env = {
			HOST: "127.0.0.1",
			PORT: "8080",
		};

		const { HOST, PORT } = defineEnv({
			HOST: host,
			PORT: port,
		}, env);

		expect(HOST).toBe("127.0.0.1");
		expect(PORT).toBe(8080);
	});
});
