import path from "node:path";
import { type SentryBuildOptions, withSentryConfig } from "@sentry/nextjs";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { withNextVideo } from "next-video/process";
import {
	POSTHOG_API_ENDPOINT,
	POSTHOG_ASSETS_HOST,
	POSTHOG_PROXY_PREFIX,
} from "./lib/posthog";

const config = {
	outputFileTracingRoot: path.join(__dirname, "../../"),
	serverExternalPackages: [
		"typescript",
		"twoslash",
		"ts-morph",
		"import-in-the-middle",
		"require-in-the-middle",
	],
	// cacheComponents: true, // TODO: Uncomment this once https://github.com/getsentry/sentry-javascript/issues/17895 is fixed
	typescript: {
		// We check typesafety on ci
		ignoreBuildErrors: true,
	},
	experimental: {
		// Aggressively reclaim memory during Webpack builds in dev mode.
		// Can be reverted if any instability is observed in Next.js 16.
		webpackMemoryOptimizations: true,
	},
	// Permanent redirects from the pre-revamp package-scoped docs tree.
	async redirects() {
		return [
			{
				source: "/docs/llms.txt",
				destination: "/llms.txt",
				permanent: true,
			},
			{
				source: "/docs/standard-schema",
				destination: "/docs/core-concepts/standard-schema",
				permanent: true,
			},

			// --- @arkenv/core (formerly /docs/arkenv) ---
			// Never 301 back to `/docs`: browsers may still have cached the old
			// permanent `/docs` → `/docs/arkenv` redirect and would loop.
			{
				source: "/docs/arkenv",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/arkenv/llms.txt",
				destination: "/llms.txt",
				permanent: true,
			},
			{
				source: "/docs/arkenv/quickstart",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/arkenv/examples",
				destination: "/docs/getting-started/examples",
				permanent: true,
			},
			{
				source: "/docs/arkenv/faq",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/arkenv/comparison",
				destination: "/docs/guides/migrating-from-t3-env",
				permanent: true,
			},
			{
				source: "/docs/arkenv/coercion",
				destination: "/docs/core-concepts/coercion",
				permanent: true,
			},
			{
				source: "/docs/arkenv/keywords",
				destination: "/docs/reference/keywords",
				permanent: true,
			},
			{
				source: "/docs/arkenv/options",
				destination: "/docs/reference/options",
				permanent: true,
			},
			{
				source: "/docs/arkenv/standard",
				destination: "/docs/reference/standard",
				permanent: true,
			},
			{
				source: "/docs/arkenv/integrations",
				destination: "/docs/guides",
				permanent: true,
			},
			{
				source: "/docs/arkenv/integrations/standard-schema",
				destination: "/docs/core-concepts/standard-schema",
				permanent: true,
			},
			{
				source: "/docs/arkenv/integrations/ai",
				destination: "/docs/guides/ai",
				permanent: true,
			},
			{
				source: "/docs/arkenv/integrations/ai/:path*",
				destination: "/docs/guides/ai",
				permanent: true,
			},
			{
				source: "/docs/arkenv/integrations/ide",
				destination: "/docs/getting-started/editor-integration",
				permanent: true,
			},
			{
				source: "/docs/arkenv/integrations/ide/:path*",
				destination: "/docs/getting-started/editor-integration",
				permanent: true,
			},
			{
				source: "/docs/arkenv/how-to/reuse-schemas",
				destination: "/docs/validating-environment-variables/reusing-schemas",
				permanent: true,
			},
			{
				source: "/docs/arkenv/how-to/load-environment-variables",
				destination:
					"/docs/validating-environment-variables/framework-integration",
				permanent: true,
			},
			{
				source: "/docs/arkenv/how-to/:path*",
				destination: "/docs/validating-environment-variables",
				permanent: true,
			},
			{
				source: "/docs/arkenv/:path*",
				destination: "/docs/getting-started",
				permanent: true,
			},

			// --- @arkenv/nextjs ---
			{
				source: "/docs/nextjs",
				destination: "/docs/guides/frameworks/nextjs",
				permanent: true,
			},
			{
				source: "/docs/nextjs/llms.txt",
				destination: "/llms.txt",
				permanent: true,
			},
			{
				source: "/docs/nextjs/layouts/simple",
				destination: "/docs/guides/frameworks/nextjs",
				permanent: true,
			},
			{
				source: "/docs/nextjs/migration/nested-to-flat",
				destination: "/docs/guides/frameworks/nextjs",
				permanent: true,
			},
			{
				source: "/docs/nextjs/:path*",
				destination: "/docs/guides/frameworks/nextjs",
				permanent: true,
			},

			// --- @arkenv/nuxt ---
			{
				source: "/docs/nuxt",
				destination: "/docs/guides/frameworks/nuxt",
				permanent: true,
			},
			{
				source: "/docs/nuxt/llms.txt",
				destination: "/llms.txt",
				permanent: true,
			},
			{
				source: "/docs/nuxt/layouts/simple",
				destination: "/docs/guides/frameworks/nuxt",
				permanent: true,
			},
			{
				source: "/docs/nuxt/:path*",
				destination: "/docs/guides/frameworks/nuxt",
				permanent: true,
			},

			// --- @arkenv/vite-plugin ---
			{
				source: "/docs/vite-plugin",
				destination: "/docs/guides/frameworks/vite",
				permanent: true,
			},
			{
				source: "/docs/vite-plugin/llms.txt",
				destination: "/llms.txt",
				permanent: true,
			},
			{
				source: "/docs/vite-plugin/:path*",
				destination: "/docs/guides/frameworks/vite",
				permanent: true,
			},

			// --- @arkenv/bun-plugin ---
			{
				source: "/docs/bun-plugin",
				destination: "/docs/guides/frameworks/bun",
				permanent: true,
			},
			{
				source: "/docs/bun-plugin/llms.txt",
				destination: "/llms.txt",
				permanent: true,
			},
			{
				source: "/docs/bun-plugin/:path*",
				destination: "/docs/guides/frameworks/bun",
				permanent: true,
			},

			// --- arkenv CLI ---
			{
				source: "/docs/cli",
				destination: "/docs/reference/init",
				permanent: true,
			},
			{
				source: "/docs/cli/llms.txt",
				destination: "/llms.txt",
				permanent: true,
			},
			{
				source: "/docs/cli/hosting-presets",
				destination: "/docs/validating-environment-variables/hosting-presets",
				permanent: true,
			},
			{
				// `--json` / `--agent` are global CLI flags; land on the Terminal hub.
				// `init` documents them in detail once the API reference content lands.
				source: "/docs/cli/machine-readable-output",
				destination: "/docs/reference",
				permanent: true,
			},
			{
				source: "/docs/cli/:path*",
				destination: "/docs/reference",
				permanent: true,
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/docs/:path*.mdx",
				destination: "/llms.mdx/docs/:path*",
			},
			{
				source: "/docs/:path*.md",
				destination: "/llms.mdx/docs/:path*",
			},
			/**
			 * PostHog rewrites to support analytics ingestion proxy
			 */
			{
				source: `${POSTHOG_PROXY_PREFIX}/static/:path*`,
				destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
			},
			{
				source: `${POSTHOG_PROXY_PREFIX}/:path*`,
				destination: `${POSTHOG_API_ENDPOINT}/:path*`,
			},
		];
	},
	// This is required to support PostHog trailing slash API requests
	skipTrailingSlashRedirect: true,
	async headers() {
		const isPreview =
			process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
			process.env.VERCEL_ENV === "preview";
		if (isPreview) {
			return [
				{
					source: "/:path*",
					headers: [
						{
							key: "X-Robots-Tag",
							value: "noindex, nofollow",
						},
					],
				},
			];
		}
		return [];
	},
} as const satisfies NextConfig;

const sentryConfig = {
	// For all available options, see:
	// https://github.com/getsentry/sentry-webpack-plugin#options

	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js proxy, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	sourcemaps: {
		deleteSourcemapsAfterUpload: true,
	},

	authToken: process.env.SENTRY_AUTH_TOKEN,
	webpack: {
		treeshake: {
			// Automatically tree-shake Sentry logger statements to reduce bundle size
			removeDebugLogging: true,
		},
		// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
		// See the following for more information:
		// https://docs.sentry.io/product/crons/
		// https://vercel.com/docs/cron-jobs
		automaticVercelMonitors: true,
		// Automatically annotate React components to show their full name in breadcrumbs and session replay
		reactComponentAnnotation: {
			enabled: true,
		},
	},
} as const satisfies SentryBuildOptions;

export default withNextVideo(
	withSentryConfig(createMDX()(config), sentryConfig),
);
