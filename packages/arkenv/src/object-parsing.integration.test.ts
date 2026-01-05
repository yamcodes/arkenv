import { describe, expect, it } from "vitest";
import { createEnv } from "./create-env";
import { type } from "./index";

describe("object parsing integration", () => {
	it("should parse JSON string into object with string properties", () => {
		const env = createEnv(
			{
				CONFIG: {
					host: "string",
					name: "string",
				},
			},
			{
				env: {
					CONFIG: '{"host": "localhost", "name": "myapp"}',
				},
			},
		);

		expect(env.CONFIG).toEqual({
			host: "localhost",
			name: "myapp",
		});
	});

	it("should parse JSON string and coerce nested number properties", () => {
		const env = createEnv(
			{
				DATABASE: {
					host: "string",
					port: "number",
				},
			},
			{
				env: {
					DATABASE: '{"host": "localhost", "port": "5432"}',
				},
			},
		);

		expect(env.DATABASE).toEqual({
			host: "localhost",
			port: 5432,
		});
		expect(typeof env.DATABASE.port).toBe("number");
	});

	it("should parse JSON string and coerce nested boolean properties", () => {
		const env = createEnv(
			{
				SETTINGS: {
					enabled: "boolean",
					debug: "boolean",
				},
			},
			{
				env: {
					SETTINGS: '{"enabled": "true", "debug": "false"}',
				},
			},
		);

		expect(env.SETTINGS).toEqual({
			enabled: true,
			debug: false,
		});
		expect(typeof env.SETTINGS.enabled).toBe("boolean");
		expect(typeof env.SETTINGS.debug).toBe("boolean");
	});

	it("should parse nested JSON objects", () => {
		const env = createEnv(
			{
				APP: {
					database: {
						host: "string",
						port: "number",
					},
					cache: {
						enabled: "boolean",
					},
				},
			},
			{
				env: {
					APP: '{"database": {"host": "localhost", "port": "5432"}, "cache": {"enabled": "true"}}',
				},
			},
		);

		expect(env.APP).toEqual({
			database: {
				host: "localhost",
				port: 5432,
			},
			cache: {
				enabled: true,
			},
		});
	});

	it("should handle object with mixed types", () => {
		const env = createEnv(
			{
				CONFIG: {
					host: "string",
					port: "number",
					enabled: "boolean",
					timeout: "number",
				},
			},
			{
				env: {
					CONFIG:
						'{"host": "localhost", "port": "3000", "enabled": "true", "timeout": "5000"}',
				},
			},
		);

		expect(env.CONFIG).toEqual({
			host: "localhost",
			port: 3000,
			enabled: true,
			timeout: 5000,
		});
	});

	it("should work with both JSON strings and separate environment variables", () => {
		const env = createEnv(
			{
				PORT: "number",
				DEBUG: "boolean",
				CONFIG: {
					host: "string",
					port: "number",
				},
			},
			{
				env: {
					PORT: "3000",
					DEBUG: "true",
					CONFIG: '{"host": "localhost", "port": "5432"}',
				},
			},
		);

		expect(env.PORT).toBe(3000);
		expect(env.DEBUG).toBe(true);
		expect(env.CONFIG).toEqual({
			host: "localhost",
			port: 5432,
		});
	});

	it("should fail when JSON string is invalid", () => {
		expect(() =>
			createEnv(
				{
					CONFIG: {
						host: "string",
					},
				},
				{
					env: {
						CONFIG: "not valid json",
					},
				},
			),
		).toThrow();
	});

	it("should fail when parsed object doesn't match schema", () => {
		expect(() =>
			createEnv(
				{
					CONFIG: {
						port: "number",
					},
				},
				{
					env: {
						CONFIG: '{"port": "not a number"}',
					},
				},
			),
		).toThrow();
	});

	it("should work with optional object properties", () => {
		const env = createEnv(
			{
				"CONFIG?": {
					host: "string",
				},
			},
			{
				env: {},
			},
		);

		expect(env.CONFIG).toBeUndefined();
	});

	it("should parse optional object when provided", () => {
		const env = createEnv(
			{
				"CONFIG?": {
					host: "string",
				},
			},
			{
				env: {
					CONFIG: '{"host": "localhost"}',
				},
			},
		);

		expect(env.CONFIG).toEqual({
			host: "localhost",
		});
	});

	it("should work with type() compiled schemas", () => {
		const schema = type({
			CONFIG: {
				host: "string",
				port: "number",
			},
		});

		const env = createEnv(schema, {
			env: {
				CONFIG: '{"host": "localhost", "port": "3000"}',
			},
		});

		expect(env.CONFIG).toEqual({
			host: "localhost",
			port: 3000,
		});
	});

	it("should handle arrays within JSON objects", () => {
		const env = createEnv(
			{
				CONFIG: {
					hosts: "string[]",
					ports: "number[]",
				},
			},
			{
				env: {
					CONFIG:
						'{"hosts": ["localhost", "127.0.0.1"], "ports": ["3000", "8080"]}',
				},
			},
		);

		expect(env.CONFIG).toEqual({
			hosts: ["localhost", "127.0.0.1"],
			ports: [3000, 8080],
		});
	});

	it("should parse JSON with whitespace", () => {
		const env = createEnv(
			{
				CONFIG: {
					host: "string",
				},
			},
			{
				env: {
					CONFIG: '  {"host": "localhost"}  ',
				},
			},
		);

		expect(env.CONFIG).toEqual({
			host: "localhost",
		});
	});

	it("should handle object with default values", () => {
		const env = createEnv(
			{
				CONFIG: type({
					host: "string",
					port: "number = 3000",
				}).default(() => ({ host: "localhost", port: 3000 })),
			},
			{
				env: {},
			},
		);

		expect(env.CONFIG).toEqual({
			host: "localhost",
			port: 3000,
		});
	});
});
