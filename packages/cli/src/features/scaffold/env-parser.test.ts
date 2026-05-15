import { describe, expect, it } from "vitest";
import { parseEnvExample } from "./env-parser";

describe("env-parser", () => {
	it("should extract keys from a standard .env.example", () => {
		const content = `
PORT=3000
DATABASE_URL=postgres://localhost:5432/db
# This is a comment
API_KEY=
      `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["PORT", "DATABASE_URL", "API_KEY"]);
	});

	it("should handle keys with underscores and numbers", () => {
		const content = `
MY_APP_V1_SECRET=foo
DB_2_URL=bar
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["MY_APP_V1_SECRET", "DB_2_URL"]);
	});

	it("should ignore comments and empty lines", () => {
		const content = `
# Header
KEY1=VAL1

# Another comment
KEY2=VAL2
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["KEY1", "KEY2"]);
	});

	it("should preserve lowercase keys", () => {
		const content = `
port=3000
database_url=foo
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["port", "database_url"]);
	});

	it("should return unique keys", () => {
		const content = `
PORT=3000
PORT=4000
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["PORT"]);
	});

	it("should ignore lines without equals sign", () => {
		const content = `
INVALID_LINE
KEY=VALUE
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["KEY"]);
	});

	it("should handle whitespace around equals", () => {
		const content = `
KEY1 = VALUE1
KEY2=VALUE2
    `;
		const keys = parseEnvExample(content);
		expect(keys).toEqual(["KEY1", "KEY2"]);
	});
});
