import { ArkEnvError } from "@arkenv/core";
import { arkenv as clientArkenv } from "@arkenv/nextjs";
import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { env } from "./env";

describe("apps/www environment configuration (ArkEnv dog-fooding)", () => {
	it("resolves valid defaults for client and shared variables", () => {
		expect(env.NEXT_PUBLIC_GITHUB_URL).toBe(
			"https://github.com/yamcodes/arkenv",
		);
		expect(env.NEXT_PUBLIC_DOCS_CONTENT_PATH).toBe("apps/www/content/docs");
		expect(typeof env.NEXT_PUBLIC_GITHUB_STAR_COUNT).toBe("boolean");
		expect(typeof env.NEXT_PUBLIC_DISCORD_LINK).toBe("boolean");
		expect(typeof env.NEXT_PUBLIC_DOCS_TOC_POPOVER).toBe("boolean");
		expect(typeof env.NEXT_PUBLIC_SENTRY_DEBUG).toBe("boolean");
		expect(["development", "production", "test"]).toContain(env.NODE_ENV);
	});

	it("prevents client-side access to server-only secrets", () => {
		const originalForceServer = (globalThis as any).__arkenv_force_server__;
		delete (globalThis as any).__arkenv_force_server__;
		try {
			// Instantiate client-side arkenv proxy simulating browser/client runtime
			const clientEnv = clientArkenv(
				{
					GITHUB_TOKEN: "string?",
					GITHUB_APP_ID: "string?",
					GITHUB_APP_PRIVATE_KEY: "string?",
					SENTRY_AUTH_TOKEN: "string?",
					NEXT_PUBLIC_GITHUB_URL:
						"string = 'https://github.com/yamcodes/arkenv'",
					VERCEL_GIT_COMMIT_REF: "string?",
				},
				{
					exposeToClient: ["VERCEL_GIT_COMMIT_REF"],
					runtimeEnv: {
						NEXT_PUBLIC_GITHUB_URL: "https://github.com/yamcodes/arkenv",
						VERCEL_GIT_COMMIT_REF: "main",
					},
				},
			);

			// Client variables and explicitly exposed variables are accessible
			expect(clientEnv.NEXT_PUBLIC_GITHUB_URL).toBe(
				"https://github.com/yamcodes/arkenv",
			);
			expect(clientEnv.VERCEL_GIT_COMMIT_REF).toBe("main");

			// Accessing server secrets on the client throws ArkEnv boundary access errors
			expect(() => (clientEnv as any).GITHUB_TOKEN).toThrow(
				"Do not access server-only key 'GITHUB_TOKEN' on the client since it will leak sensitive data (prevented by ArkEnv)",
			);
			expect(() => (clientEnv as any).GITHUB_APP_PRIVATE_KEY).toThrow(
				"Do not access server-only key 'GITHUB_APP_PRIVATE_KEY' on the client since it will leak sensitive data (prevented by ArkEnv)",
			);
			expect(() => (clientEnv as any).SENTRY_AUTH_TOKEN).toThrow(
				"Do not access server-only key 'SENTRY_AUTH_TOKEN' on the client since it will leak sensitive data (prevented by ArkEnv)",
			);
		} finally {
			if (originalForceServer !== undefined) {
				(globalThis as any).__arkenv_force_server__ = originalForceServer;
			}
		}
	});

	it("handles multiline and escaped newlines for GITHUB_APP_PRIVATE_KEY", () => {
		const rawPem = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0m4w...
-----END RSA PRIVATE KEY-----`;
		const escapedPem =
			"-----BEGIN RSA PRIVATE KEY-----\\nMIIEowIBAAKCAQEA0m4w...\\n-----END RSA PRIVATE KEY-----";

		// Direct multiline
		const parsedMultiline = clientArkenv(
			{
				GITHUB_APP_PRIVATE_KEY: "string",
			},
			{
				runtimeEnv: { GITHUB_APP_PRIVATE_KEY: rawPem },
			},
		);
		// Escaped \\n string as injected by CI/Vercel env dashboards
		const parsedEscaped = clientArkenv(
			{
				GITHUB_APP_PRIVATE_KEY: "string",
			},
			{
				runtimeEnv: { GITHUB_APP_PRIVATE_KEY: escapedPem },
			},
		);

		const normalize = (key: string) =>
			key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;

		// Assert on arkenv parsing results directly
		expect((parsedMultiline as any).GITHUB_APP_PRIVATE_KEY).toBe(rawPem);
		expect((parsedEscaped as any).GITHUB_APP_PRIVATE_KEY).toBe(escapedPem);
		expect(
			normalize((parsedMultiline as any).GITHUB_APP_PRIVATE_KEY),
		).toContain("\n");
		expect(normalize((parsedEscaped as any).GITHUB_APP_PRIVATE_KEY)).toEqual(
			rawPem,
		);
		expect(
			normalize((parsedEscaped as any).GITHUB_APP_PRIVATE_KEY),
		).not.toContain("\\n");
	});

	it("fails fast with ArkEnvError when schema validation encounters invalid values", () => {
		// VERCEL_ENV must be 'production' | 'preview' | 'development'
		expect(() => {
			clientArkenv(
				{
					VERCEL_ENV: "'production' | 'preview' | 'development'?",
				},
				{
					runtimeEnv: {
						VERCEL_ENV: "staging",
					},
				},
			);
		}).toThrow(ArkEnvError);
	});

	it("fails fast when a numeric sample rate is malformed", () => {
		expect(() => {
			clientArkenv(
				{
					NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_CLIENT: "number?",
				},
				{
					runtimeEnv: {
						NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_CLIENT: "not-a-number",
					},
				},
			);
		}).toThrow(ArkEnvError);
	});

	it("strips trailing slashes from NEXT_PUBLIC_DOCS_CONTENT_PATH using ArkType pipe", () => {
		const parsed = clientArkenv(
			{
				NEXT_PUBLIC_DOCS_CONTENT_PATH: type("string")
					.pipe((s: string) => s.replace(/\/+$/, ""))
					.default("apps/www/content/docs"),
			},
			{
				runtimeEnv: {
					NEXT_PUBLIC_DOCS_CONTENT_PATH: "custom/content/path///",
				},
			},
		);
		expect(parsed.NEXT_PUBLIC_DOCS_CONTENT_PATH).toBe("custom/content/path");
		expect(env.NEXT_PUBLIC_DOCS_CONTENT_PATH).toBe("apps/www/content/docs");
	});
});
