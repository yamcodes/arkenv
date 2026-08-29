import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ArkEnvError, type } from "@arkenv/core";
// Client-resolved package entry (conditional exports `default`)
import { arkenv as clientArkenv } from "./index";
// Server / RSC entry (conditional exports `react-server`)
import { arkenv as serverArkenv } from "./react-server";

/**
 * Recipe coverage: two `arkenv()` modules with `extends: [clientEnv]`, without
 * the removed `@arkenv/nextjs/client` or `/server` product surface.
 * Userland may add `import "server-only"` on the server module.
 */
describe("Separate files Next.js recipe (multi-module extends)", () => {
	it("should support extends to merge validated outputs", () => {
		const clientEnv = clientArkenv(
			{
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);

		const serverEnv = serverArkenv(
			{
				DATABASE_URL: "string",
			},
			{
				extends: [clientEnv],
				runtimeEnv: {
					DATABASE_URL: "postgres://localhost:5432/db",
				},
			},
		);

		expect(serverEnv.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should throw for server-only variables on the client with extends", () => {
		const clientEnv = clientArkenv(
			{
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);

		const serverEnv = serverArkenv(
			{
				DATABASE_URL: "string",
			},
			{
				extends: [clientEnv],
				runtimeEnv: {
					DATABASE_URL: "postgres://localhost:5432/db",
				},
			},
		);

		const clientExtendingServer = clientArkenv(
			{
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				extends: [serverEnv] as any,
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);

		expect(clientExtendingServer.NEXT_PUBLIC_API_URL).toBe(
			"https://api.example.com",
		);

		try {
			// @ts-expect-error DATABASE_URL is not allowed on client
			clientExtendingServer.DATABASE_URL;
			expect.fail("Expected boundary access error");
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect(error).not.toBeInstanceOf(ArkEnvError);
			expect((error as Error).name).toBe("Error");
			expect((error as Error).message).toBe(
				"Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
			);
			expect(String(error)).toBe(
				"Error: Do not access server-only key 'DATABASE_URL' on the client since it will leak sensitive data (prevented by ArkEnv)",
			);
		}
	});

	it("should throw typo/unknown key errors", () => {
		const env = clientArkenv(
			{
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);

		expect(() => {
			(env as any).NEXT_PUBLIC_API_URR;
		}).toThrow(
			"Environment variable 'NEXT_PUBLIC_API_URR' is not defined in the schema.",
		);
	});

	it("should support shared keys with extends", () => {
		const sharedEnv = clientArkenv(
			{
				NODE_ENV: "string",
			},
			{
				runtimeEnv: {
					NODE_ENV: "development",
				},
			},
		);

		const serverEnv = serverArkenv(
			{
				DATABASE_URL: "string",
				API_VERSION: "string",
			},
			{
				extends: [sharedEnv],
				exposeToClient: ["API_VERSION"],
				runtimeEnv: {
					DATABASE_URL: "postgres://localhost:5432/db",
					API_VERSION: "v1",
					NODE_ENV: "development",
				},
			},
		);

		expect(serverEnv.NODE_ENV).toBe("development");
		expect(serverEnv.API_VERSION).toBe("v1");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should support multiple extends arrays", () => {
		const clientEnv = clientArkenv(
			{
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
				},
			},
		);

		const sharedEnv = clientArkenv(
			{
				NODE_ENV: "string",
			},
			{
				runtimeEnv: {
					NODE_ENV: "production",
				},
			},
		);

		const serverEnv = serverArkenv(
			{
				DATABASE_URL: "string",
			},
			{
				extends: [clientEnv, sharedEnv],
				runtimeEnv: {
					DATABASE_URL: "postgres://localhost:5432/db",
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "production",
				},
			},
		);

		expect(serverEnv.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(serverEnv.NODE_ENV).toBe("production");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should support flat schema with SharedSchema type() and extends", () => {
		const SharedSchema = type({
			NODE_ENV: "'development' | 'production' | 'test'",
		});

		const clientEnv = clientArkenv(
			{
				NEXT_PUBLIC_API_URL: "string",
			},
			{
				extends: [SharedSchema],
				runtimeEnv: {
					NEXT_PUBLIC_API_URL: "https://api.example.com",
					NODE_ENV: "development",
				},
			},
		);

		const serverEnv = serverArkenv(
			{
				DATABASE_URL: "string",
			},
			{
				extends: [clientEnv],
				runtimeEnv: {
					DATABASE_URL: "postgres://localhost/db",
				},
			},
		);

		expect(serverEnv.NODE_ENV).toBe("development");
		expect(serverEnv.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost/db");

		expect(() => {
			(clientEnv as any).DATABASE_URL;
		}).toThrow(
			"Environment variable 'DATABASE_URL' is not defined in the schema.",
		);
	});

	it("should reject extra keys in runtimeEnv not defined in the schema", () => {
		expect(() => {
			clientArkenv(
				{
					NEXT_PUBLIC_API_URL: "string",
				},
				{
					runtimeEnv: {
						NEXT_PUBLIC_API_URL: "https://api.example.com",
						DATABASE_URL: "postgres://localhost/db",
					} as any,
				},
			);
		}).toThrow(
			"Environment variable 'DATABASE_URL' is passed to runtimeEnv but is not defined in the schema.",
		);
	});
});
