import path from "node:path";
import { type SentryBuildOptions, withSentryConfig } from "@sentry/nextjs";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import {
	POSTHOG_API_ENDPOINT,
	POSTHOG_ASSETS_HOST,
	POSTHOG_PROXY_PREFIX,
} from "./lib/posthog";

const config = {
	outputFileTracingRoot: path.join(__dirname, "../../"),
	// @arkenv/fumadocs-ui resolves fumadocs-* from its own node_modules.
	// A second copy means RootProvider's FrameworkProvider is not the one
	// DocsLayout / sidebar slots read — "wrap your application inside FrameworkProvider".
	transpilePackages: ["@arkenv/fumadocs-ui"],
	turbopack: {
		resolveAlias: {
			"fumadocs-ui": path.join(__dirname, "node_modules/fumadocs-ui"),
			"fumadocs-core": path.join(__dirname, "node_modules/fumadocs-core"),
		},
	},
	webpack: (webpackConfig) => {
		webpackConfig.resolve ??= {};
		webpackConfig.resolve.alias = {
			...webpackConfig.resolve.alias,
			"fumadocs-ui": path.join(__dirname, "node_modules/fumadocs-ui"),
			"fumadocs-core": path.join(__dirname, "node_modules/fumadocs-core"),
		};
		return webpackConfig;
	},
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
				source: "/faq",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/faq",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/cli/faq",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/nextjs/faq",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/nuxt/faq",
				destination: "/docs/getting-started",
				permanent: true,
			},
			{
				source: "/docs/nextjs/security",
				destination: "/docs/validating-your-environment/client-vs-server",
				permanent: true,
			},
			{
				source: "/docs/nuxt/security",
				destination: "/docs/validating-your-environment/client-vs-server",
				permanent: true,
			},
			{
				source: "/docs/support-policy",
				destination: "/docs/compatibility",
				permanent: true,
			},
			{
				source: "/docs/standard-schema",
				destination: "/docs/guides/validators/choosing-an-engine",
				permanent: true,
			},

			// --- core-concepts → validating-your-environment (v1 IA fold) ---
			{
				source: "/docs/core-concepts",
				destination: "/docs/validating-your-environment",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/coercion",
				destination: "/docs/validating-your-environment/coercion-and-parsing",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/transformation",
				destination: "/docs/validating-your-environment/coercion-and-parsing",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/morphs",
				destination: "/docs/validating-your-environment/coercion-and-parsing",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/transforms",
				destination: "/docs/validating-your-environment/coercion-and-parsing",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/typesafety",
				destination: "/docs/validating-your-environment/defining-your-schema",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/validation",
				destination: "/docs/validating-your-environment/defining-your-schema",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/standard-schema",
				destination: "/docs/guides/validators/choosing-an-engine",
				permanent: true,
			},
			{
				source: "/docs/core-concepts/:path*",
				destination: "/docs/validating-your-environment",
				permanent: true,
			},
			{
				source: "/docs/validating-your-environment/defining-types",
				destination: "/docs/validating-your-environment/defining-your-schema",
				permanent: true,
			},
			{
				source: "/docs/validating-your-environment/structuring-your-schema",
				destination: "/docs/validating-your-environment/defining-your-schema",
				permanent: true,
			},
			{
				source: "/docs/validating-your-environment/framework-integration",
				destination: "/docs/guides/frameworks",
				permanent: true,
			},
			{
				source: "/docs/validating-your-environment/choosing-an-engine",
				destination: "/docs/guides/validators/choosing-an-engine",
				permanent: true,
			},
			{
				source: "/docs/getting-started/add-to-existing-repository",
				destination: "/docs/getting-started/installation",
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
				destination: "/docs/comparison",
				permanent: true,
			},
			{
				source: "/docs/arkenv/coercion",
				destination: "/docs/validating-your-environment/coercion-and-parsing",
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
				destination: "/docs/guides/validators/choosing-an-engine",
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
				destination: "/docs/validating-your-environment/reusing-schemas",
				permanent: true,
			},
			{
				source: "/docs/arkenv/how-to/load-environment-variables",
				destination: "/docs/guides/frameworks",
				permanent: true,
			},
			{
				source: "/docs/arkenv/how-to/:path*",
				destination: "/docs/validating-your-environment",
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
				destination: "/docs/validating-your-environment/hosting-presets",
				permanent: true,
			},
			{
				// `--json` / `--agent` are global CLI flags; documented on init.
				source: "/docs/cli/machine-readable-output",
				destination: "/docs/reference/init",
				permanent: true,
			},
			{
				source: "/docs/reference/add-host",
				destination: "/docs/reference/preset",
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

export default withSentryConfig(createMDX()(config), sentryConfig);
