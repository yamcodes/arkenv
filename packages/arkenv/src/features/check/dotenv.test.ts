import { describe, expect, it } from "vitest";
import { parseDotenv } from "./dotenv";

describe("parseDotenv", () => {
	it("parses simple key-value pairs", () => {
		const content = `
PORT=3000
HOST=localhost
DEBUG=true
`;
		expect(parseDotenv(content)).toEqual({
			PORT: "3000",
			HOST: "localhost",
			DEBUG: "true",
		});
	});

	it("ignores comments and blank lines", () => {
		const content = `
# This is a comment
PORT=3000

# Another comment
HOST=localhost
`;
		expect(parseDotenv(content)).toEqual({
			PORT: "3000",
			HOST: "localhost",
		});
	});

	it("handles export prefix", () => {
		const content = `
export PORT=3000
export HOST=localhost
`;
		expect(parseDotenv(content)).toEqual({
			PORT: "3000",
			HOST: "localhost",
		});
	});

	it("handles double-quoted strings with escape sequences", () => {
		const content = `
GREETING="Hello\\nWorld"
TABBED="A\\tB"
QUOTED="He said \\"Hello\\""
ESCAPED_SLASH="C:\\\\Program Files\\\\App"
ESCAPED_NEWLINE_LITERAL="Literal\\\\nNotNewline"
TRAILING_SLASH="EndingWithSlash\\\\"
`;
		expect(parseDotenv(content)).toEqual({
			GREETING: "Hello\nWorld",
			TABBED: "A\tB",
			QUOTED: 'He said "Hello"',
			ESCAPED_SLASH: "C:\\Program Files\\App",
			ESCAPED_NEWLINE_LITERAL: "Literal\\nNotNewline",
			TRAILING_SLASH: "EndingWithSlash\\",
		});
	});

	it("handles single-quoted and backtick strings literally including backslashes", () => {
		const content = `
RAW_URL='https://example.com?a=1&b=2'
BACKTICK=\`simple value\`
TRAILING_BACKSLASH='C:\\Windows\\'
LITERAL_ESCAPE='Hello\\nWorld'
`;
		expect(parseDotenv(content)).toEqual({
			RAW_URL: "https://example.com?a=1&b=2",
			BACKTICK: "simple value",
			TRAILING_BACKSLASH: "C:\\Windows\\",
			LITERAL_ESCAPE: "Hello\\nWorld",
		});
	});

	it("handles multiline quoted values", () => {
		const content = `
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA
-----END RSA PRIVATE KEY-----"
ANOTHER_VAR=value
`;
		expect(parseDotenv(content)).toEqual({
			PRIVATE_KEY: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA
-----END RSA PRIVATE KEY-----`,
			ANOTHER_VAR: "value",
		});
	});

	it("strips trailing inline comments on unquoted values", () => {
		const content = `
PORT=3000 # The server port
DATABASE_URL=postgres://localhost:5432/db # Primary database
`;
		expect(parseDotenv(content)).toEqual({
			PORT: "3000",
			DATABASE_URL: "postgres://localhost:5432/db",
		});
	});

	it("preserves hash inside quoted values", () => {
		const content = `
COLOR="#ff0000"
HASH_IN_SINGLE='#abcdef'
`;
		expect(parseDotenv(content)).toEqual({
			COLOR: "#ff0000",
			HASH_IN_SINGLE: "#abcdef",
		});
	});

	it("handles empty values", () => {
		const content = `
EMPTY=
EMPTY_QUOTED=""
`;
		expect(parseDotenv(content)).toEqual({
			EMPTY: "",
			EMPTY_QUOTED: "",
		});
	});

	it("overwrites duplicate keys with later values", () => {
		const content = `
PORT=3000
PORT=8080
`;
		expect(parseDotenv(content)).toEqual({
			PORT: "8080",
		});
	});
});
