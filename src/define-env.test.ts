import { describe, expect, it } from "bun:test";
import { red } from "picocolors";
import { defineEnv } from "./define-env";
import { host, port } from "./types";
import { indent } from "./utils";

const expectedError = (errors: string[]) =>
	`${red("Errors found while validating environment variables:")}\n${indent(
		errors.join("\n"),
	)}\n`;

describe("defineEnv", () => {
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

		expect(() =>
			defineEnv({
				HOST: "string.ip",
			}),
		).toThrow(expectedError(['HOST must be an IP address (was "invalid")']));
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

		expect(() =>
			defineEnv({
				PORT: port,
			}),
		).toThrow(
			expectedError([
				'PORT must be an integer between 0 and 65535 (was "invalid")',
			]),
		);
	});

	it("should throw when the port is invalid (2)", () => {
		process.env.PORT = "-2";

		expect(() =>
			defineEnv({
				PORT: port,
			}),
		).toThrow(
			expectedError(['PORT must be an integer between 0 and 65535 (was "-2")']),
		);
	});

	it("should throw when required env variable is missing", () => {
		expect(() =>
			defineEnv({
				MISSING_VAR: "string",
			}),
		).toThrow(expectedError(["MISSING_VAR must be a string (was missing)"]));
	});

	it("should throw when env variable has wrong type", () => {
		process.env.WRONG_TYPE = "not a number";

		expect(() =>
			defineEnv({
				WRONG_TYPE: "number",
			}),
		).toThrow(expectedError(["WRONG_TYPE must be a number (was a string)"]));
	});

	it("should validate against a custom environment", () => {
		const env = {
			HOST: "127.0.0.1",
			PORT: "8080",
		};

		const { HOST, PORT } = defineEnv(
			{
				HOST: host,
				PORT: port,
			},
			env,
		);

		expect(HOST).toBe("127.0.0.1");
		expect(PORT).toBe(8080);
	});
});
