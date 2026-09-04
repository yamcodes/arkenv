import { type } from "arktype";
import arkenv from "@/.arkenv";

export const env = arkenv(
	{
		// --- Server-only Environment Variables ---
		GITHUB_TOKEN: "string?",
		GITHUB_APP_ID: "string?",
		GITHUB_APP_PRIVATE_KEY: "string?",
		SENTRY_ORG: "string?",
		SENTRY_PROJECT: "string?",
		SENTRY_AUTH_TOKEN: "string?",
		CI: "boolean = false",

		// --- Client-side Environment Variables (NEXT_PUBLIC_*) ---
		NEXT_PUBLIC_GITHUB_URL: "string = 'https://github.com/yamcodes/arkenv'",
		NEXT_PUBLIC_GITHUB_BRANCH: "string?",
		NEXT_PUBLIC_DOCS_CONTENT_PATH: type("string")
			.pipe((s: string) => s.replace(/\/+$/, ""))
			.default("apps/www/content/docs"),
		NEXT_PUBLIC_POSTHOG_KEY: "string?",
		NEXT_PUBLIC_SENTRY_DSN: "string?",
		NEXT_PUBLIC_SENTRY_DEBUG: "boolean = false",
		NEXT_PUBLIC_SENTRY_ENABLED: "boolean?",
		NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_CLIENT: "number?",
		NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_SERVER: "number?",
		NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_EDGE: "number?",
		NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE: "number?",
		NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE: "number?",
		NEXT_PUBLIC_DISCORD_LINK: "boolean = false",
		NEXT_PUBLIC_DOCS_TOC_POPOVER: "boolean = false",
		NEXT_PUBLIC_GITHUB_STAR_COUNT: "boolean = false",

		// @arkenv-preset-start vercel
		VERCEL: "string?",
		VERCEL_ENV: "'production' | 'preview' | 'development'?",
		VERCEL_URL: "string?",
		VERCEL_GIT_COMMIT_REF: "string?",
		NEXT_PUBLIC_VERCEL_ENV: "'production' | 'preview' | 'development'?",
		NEXT_PUBLIC_VERCEL_URL: "string?",
		// @arkenv-preset-end vercel

		// --- Shared Environment Variables ---
		NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	},
	{
		exposeToClient: ["VERCEL_GIT_COMMIT_REF"],
	},
);

export type Env = typeof env;
