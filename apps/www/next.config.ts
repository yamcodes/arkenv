import path from "node:path";
import { type SentryBuildOptions, withSentryConfig } from "@sentry/nextjs";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { withNextVideo } from "next-video/process";

const config = {
	outputFileTracingRoot: path.join(__dirname, "../../"),
	serverExternalPackages: ["typescript", "twoslash", "ts-morph"],
	// cacheComponents: true, // TODO: Uncomment this once https://github.com/getsentry/sentry-javascript/issues/17895 is fixed
	typescript: {
		// We check typesafety on ci
		ignoreBuildErrors: true,
	},
	// PostHog rewrites to support analytics ingestion proxy
	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://eu.i.posthog.com/:path*",
			},
		];
	},
	// This is required to support PostHog trailing slash API requests
	skipTrailingSlashRedirect: true,
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

	// Automatically annotate React components to show their full name in breadcrumbs and session replay
	reactComponentAnnotation: {
		enabled: true,
	},

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
	// See the following for more information:
	// https://docs.sentry.io/product/crons/
	// https://vercel.com/docs/cron-jobs
	automaticVercelMonitors: true,

	sourcemaps: {
		deleteSourcemapsAfterUpload: true,
	},

	authToken: process.env.SENTRY_AUTH_TOKEN,
} as const satisfies SentryBuildOptions;

export default withNextVideo(
	withSentryConfig(createMDX()(config), sentryConfig),
);