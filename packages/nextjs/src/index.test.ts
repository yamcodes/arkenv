import { ArkEnvError } from "@arkenv/core";
import { nestedBagMigrationErrorMessage } from "@repo/utils/nested-bag-migration-error";
import { describe, expect, it } from "vitest";
import { arkenv as clientArkenv } from "./index";
import { arkenv as serverArkenv } from "./react-server";

function expectBoundaryAccessError(run: () => unknown, key: string): void {
	try {
		run();
		expect.fail("Expected boundary access error");
	} catch (error) {
		expect(error).toBeInstanceOf(Error);
		expect(error).not.toBeInstanceOf(ArkEnvError);
		expect((error as Error).name).toBe("Error");
		expect((error as Error).message).toBe(
			`Do not access server-only key '${key}' on the client since it will leak sensitive data (prevented by ArkEnv)`,
		);
		expect(String(error)).toBe(
			`Error: Do not access server-only key '${key}' on the client since it will leak sensitive data (prevented by ArkEnv)`,
		);
	}
}

describe("arkenv (RSC / Server Entrypoint)", () => {
	it("should parse a basic environment variable", () => {
		const originalEnv = process.env.DATABASE_URL;
		process.env.DATABASE_URL = "postgres://localhost:5432/db";

		try {
			const env = serverArkenv({ DATABASE_URL: "string" }, { runtimeEnv: {} });
			expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
		} finally {
			if (originalEnv === undefined) {
				delete process.env.DATABASE_URL;
			} else {
				process.env.DATABASE_URL = originalEnv;
			}
		}
	});

	it("should allow accessing server-only, client, and shared variables on the server", () => {
		const env = serverArkenv(
			{
				DATABASE_URL: "string",
				NEXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "test",
					DATABASE_URL: "postgres://localhost:5432/db",
				},
			},
		);

		expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("should automatically fall back to process.env for server-only keys omitted from runtimeEnv on the server", () => {
		const originalEnv = process.env.DATABASE_URL;
		process.env.DATABASE_URL = "postgres://localhost:5432/fallback_db";

		try {
			const env = serverArkenv(
				{
					DATABASE_URL: "string",
				},
				{
					runtimeEnv: {},
				},
			);

			expect(env.DATABASE_URL).toBe("postgres://localhost:5432/fallback_db");
		} finally {
			if (originalEnv === undefined) {
				delete process.env.DATABASE_URL;
			} else {
				process.env.DATABASE_URL = originalEnv;
			}
		}
	});

	it("should reject the removed nested bag API", () => {
		expect(() =>
			serverArkenv({
				server: { DATABASE_URL: "string" },
				runtimeEnv: { DATABASE_URL: "postgres://localhost" },
			} as never),
		).toThrow(nestedBagMigrationErrorMessage());
	});
});

describe("arkenv (Client / SSR Entrypoint)", () => {
	it("should only validate client and shared schemas, skipping server schema validation", () => {
		const env = clientArkenv(
			{
				DATABASE_URL: "string",
				NEXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "test",
				},
			},
		);

		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(env.NODE_ENV).toBe("test");
	});

	it("should throw an error when accessing a server-side variable (simulating SSR / pre-rendering)", () => {
		const env = clientArkenv(
			{
				DATABASE_URL: "string",
				NEXT_PUBLIC_API_URL: "string",
				NODE_ENV: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "test",
				},
			},
		);

		expectBoundaryAccessError(() => (env as any).DATABASE_URL, "DATABASE_URL");
	});

	it("should support default values in schema when omitted or undefined in runtimeEnv", () => {
		const env = clientArkenv(
			{
				DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
				NEXT_PUBLIC_API_URL: "string = 'https://api.example.com'",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: undefined,
				},
			},
		);

		expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
	});

	it("should reject the removed nested bag API", () => {
		expect(() =>
			clientArkenv({
				server: { DATABASE_URL: "string" },
				client: { NEXT_PUBLIC_API_URL: "string" },
				runtimeEnv: { NEXT_PUBLIC_API_URL: "https://api.example.com" },
			} as never),
		).toThrow(nestedBagMigrationErrorMessage());
	});

	describe("Flat Mode", () => {
		it("should validate and allow access to client and exposed variables, but throw for server-only variables on client", () => {
			const env = clientArkenv(
				{
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
					NODE_ENV: "string",
					CUSTOM_VAR: "string",
				},
				{
					exposeToClient: ["CUSTOM_VAR"],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
						CUSTOM_VAR: "custom_val",
					},
				},
			);

			expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");
			expect((env as any).CUSTOM_VAR).toBe("custom_val");

			expectBoundaryAccessError(
				() => (env as any).DATABASE_URL,
				"DATABASE_URL",
			);
		});

		it("should allow accessing all variables on the server in Flat Mode", () => {
			const env = serverArkenv(
				{
					DATABASE_URL: "string",
					NEXT_PUBLIC_API_URL: "string",
					NODE_ENV: "string",
					CUSTOM_VAR: "string",
				},
				{
					exposeToClient: ["CUSTOM_VAR"],
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
						NODE_ENV: "test",
						DATABASE_URL: "postgres://localhost:5432/db",
						CUSTOM_VAR: "custom_val",
					},
				},
			);

			expect(env.DATABASE_URL).toBe("postgres://localhost:5432/db");
			expect(env.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
			expect(env.NODE_ENV).toBe("test");
			expect((env as any).CUSTOM_VAR).toBe("custom_val");
		});

		it("should reject removed expose / shared option aliases", () => {
			expect(() =>
				clientArkenv(
					{
						DATABASE_URL: "string",
						NEXT_PUBLIC_API_URL: "string",
						NODE_ENV: "string",
						CUSTOM_VAR: "string",
					},
					{
						expose: ["CUSTOM_VAR"],
						runtimeEnv: {
							NEXT_PUBLIC_API_URL: "https://api.example.com",
							NODE_ENV: "test",
							CUSTOM_VAR: "custom_val",
						},
					} as never,
				),
			).toThrow(/expose and shared option aliases/);
		});

		it("should not treat a flat env key named server as the nested bag API", () => {
			const original = process.env.server;
			process.env.server = "ok";
			try {
				const env = serverArkenv({ server: "string" }, { runtimeEnv: {} });
				expect(env.server).toBe("ok");
			} finally {
				if (original === undefined) {
					delete process.env.server;
				} else {
					process.env.server = original;
				}
			}
		});
	});
});
