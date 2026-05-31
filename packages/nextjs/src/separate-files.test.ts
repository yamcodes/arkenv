import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createEnv as clientCreateEnv } from "./client";
import { createEnv as serverCreateEnv } from "./server";
import { createEnv as serverReactCreateEnv } from "./server.react-server";
import { type } from "./shared";

describe("Separate Files Next.js mode", () => {
	it("should import server-only in server.ts", () => {
		const serverCode = fs.readFileSync(
			path.join(__dirname, "server.ts"),
			"utf-8",
		);
		expect(serverCode).toContain('import "server-only";');
	});

	it("should disallow client schema in server entry point at runtime", () => {
		expect(() => {
			serverCreateEnv({
				client: {
					NEXT_PUBLIC_API_URL: "string",
				},
				runtimeEnv: {} as any,
			} as any);
		}).toThrow(
			"server entry point only accepts 'server' and 'shared' schemas.",
		);

		expect(() => {
			serverReactCreateEnv({
				client: {
					NEXT_PUBLIC_API_URL: "string",
				},
				runtimeEnv: {} as any,
			} as any);
		}).toThrow(
			"server entry point only accepts 'server' and 'shared' schemas.",
		);
	});

	it("should disallow server schema in client entry point at runtime", () => {
		expect(() => {
			clientCreateEnv({
				// @ts-expect-error server schema not allowed
				server: {
					DATABASE_URL: "string",
				},
				runtimeEnv: {} as any,
			});
		}).toThrow(
			"client entry point only accepts 'client' and 'shared' schemas.",
		);
	});

	it("should support extends to merge validated outputs", () => {
		const clientEnv = clientCreateEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		const serverEnv = serverCreateEnv({
			server: {
				DATABASE_URL: "string",
			},
			extends: [clientEnv],
			runtimeEnv: {
				DATABASE_URL: "postgres://localhost:5432/db",
			},
		});

		expect(serverEnv.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should throw for server-only variables on the client with extends", () => {
		const clientEnv = clientCreateEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		const serverEnv = serverCreateEnv({
			server: {
				DATABASE_URL: "string",
			},
			extends: [clientEnv],
			runtimeEnv: {
				DATABASE_URL: "postgres://localhost:5432/db",
			},
		});

		const clientExtendingServer = clientCreateEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			extends: [serverEnv] as any,
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		expect(clientExtendingServer.NEXT_PUBLIC_API_URL).toBe(
			"https://api.example.com",
		);

		expect(() => {
			// @ts-expect-error DATABASE_URL is not allowed on client
			clientExtendingServer.DATABASE_URL;
		}).toThrow(
			"Accessing server-side environment variable 'DATABASE_URL' on the client is not allowed.",
		);
	});

	it("should throw typo/unknown key errors", () => {
		const env = clientCreateEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		expect(() => {
			(env as any).NEXT_PUBLIC_API_URR;
		}).toThrow(
			"Environment variable 'NEXT_PUBLIC_API_URR' is not defined in the schema.",
		);
	});

	it("should support shared schema with extends", () => {
		const sharedEnv = clientCreateEnv({
			shared: {
				NODE_ENV: "string",
			},
			runtimeEnv: {
				NODE_ENV: "development",
			},
		});

		const serverEnv = serverCreateEnv({
			server: {
				DATABASE_URL: "string",
			},
			shared: {
				API_VERSION: "string",
			},
			extends: [sharedEnv],
			runtimeEnv: {
				DATABASE_URL: "postgres://localhost:5432/db",
				API_VERSION: "v1",
				NODE_ENV: "development",
			},
		});

		expect(serverEnv.NODE_ENV).toBe("development");
		expect(serverEnv.API_VERSION).toBe("v1");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should support multiple extends arrays", () => {
		const clientEnv = clientCreateEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		const sharedEnv = clientCreateEnv({
			shared: {
				NODE_ENV: "string",
			},
			runtimeEnv: {
				NODE_ENV: "production",
			},
		});

		const serverEnv = serverCreateEnv({
			server: {
				DATABASE_URL: "string",
			},
			extends: [clientEnv, sharedEnv],
			runtimeEnv: {
				DATABASE_URL: "postgres://localhost:5432/db",
				NEXT_PUBLIC_API_URL: "https://api.example.com",
				NODE_ENV: "production",
			},
		});

		expect(serverEnv.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(serverEnv.NODE_ENV).toBe("production");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should support extends in server.react-server.ts entry point", () => {
		const clientEnv = clientCreateEnv({
			client: {
				NEXT_PUBLIC_API_URL: "string",
			},
			runtimeEnv: {
				NEXT_PUBLIC_API_URL: "https://api.example.com",
			},
		});

		const serverEnv = serverReactCreateEnv({
			server: {
				DATABASE_URL: "string",
			},
			extends: [clientEnv],
			runtimeEnv: {
				DATABASE_URL: "postgres://localhost:5432/db",
			},
		});

		expect(serverEnv.NEXT_PUBLIC_API_URL).toBe("https://api.example.com");
		expect(serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
	});

	it("should support flat schema with 3-file separate config and extends", () => {
		const SharedSchema = type({
			NODE_ENV: "'development' | 'production' | 'test'",
		});

		const clientEnv = clientCreateEnv(
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

		const serverEnv = serverCreateEnv(
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

	it("should reject client-side flat schema with non-NEXT_PUBLIC_ prefix at runtime", () => {
		expect(() => {
			clientCreateEnv(
				{
					API_URL: "string",
				} as any,
				{
					runtimeEnv: {
						API_URL: "https://api.example.com",
					},
				},
			);
		}).toThrow(
			"Client-side environment variables must be prefixed with 'NEXT_PUBLIC_'. Found invalid key: API_URL",
		);
	});

	it("should reject extra keys in runtimeEnv not defined in the schema", () => {
		expect(() => {
			clientCreateEnv(
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
