// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { env } from "~/env";

// Resolve environment consistently on the server
const ENV = env.NEXT_PUBLIC_VERCEL_ENV || env.VERCEL_ENV || env.NODE_ENV;

// biome-ignore lint/correctness/noUnusedVariables: Might be used later
const isDev = ENV === "development";
const isPreview = ENV === "preview";
const isProd = ENV === "production";

// Optional manual kill-switch
const explicitEnabled = env.NEXT_PUBLIC_SENTRY_ENABLED;

// Enable only in preview/prod unless explicitly overridden
const enabled = explicitEnabled ?? (isPreview || isProd);

// Safer defaults from env with sensible fallbacks
const tracesRateEnv = env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_SERVER;

Sentry.init({
	dsn: env.NEXT_PUBLIC_SENTRY_DSN,
	enabled,

	environment: ENV, // "development" | "preview" | "production"

	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,

	// Tracing: higher in preview for catch-rate, lower in prod by default
	tracesSampleRate: isProd
		? Number.isFinite(tracesRateEnv)
			? (tracesRateEnv as number)
			: 0.2
		: isPreview
			? Number.isFinite(tracesRateEnv)
				? (tracesRateEnv as number)
				: 0.3
			: 0, // dev off

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: env.NEXT_PUBLIC_SENTRY_DEBUG && !isProd,
});
