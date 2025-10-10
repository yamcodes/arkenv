// instrumentation-client.ts
import * as Sentry from "@sentry/nextjs";

// Resolve environment consistently on the client
const ENV =
	process.env.NEXT_PUBLIC_VERCEL_ENV ||
	process.env.VERCEL_ENV ||
	process.env.NODE_ENV; // fallback

// biome-ignore lint/correctness/noUnusedVariables: Might be used later
const isDev = ENV === "development";
const isPreview = ENV === "preview";
const isProd = ENV === "production";

// Optional manual kill-switch
const explicitEnabled =
	typeof process.env.NEXT_PUBLIC_SENTRY_ENABLED === "string"
		? process.env.NEXT_PUBLIC_SENTRY_ENABLED === "true"
		: undefined;

// Enable only in preview/prod unless explicitly overridden
const enabled = explicitEnabled ?? (isPreview || isProd);

// Safer defaults from env with sensible fallbacks
const tracesRateEnv = Number(
	process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_CLIENT,
);
const replaysSessionRateEnv = Number(
	process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
);
const replaysOnErrorRateEnv = Number(
	process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
);

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	enabled,

	environment: ENV, // "development" | "preview" | "production"

	// Keep console capture out of prod to reduce noise. Use it in preview for QA.
	integrations: [
		...(isPreview || (explicitEnabled && !isProd)
			? [Sentry.captureConsoleIntegration()]
			: []),
		...(isProd || isPreview ? [Sentry.replayIntegration()] : []),
	],

	// Tracing: higher in preview for catch-rate, lower in prod by default
	tracesSampleRate: isProd
		? Number.isFinite(tracesRateEnv)
			? tracesRateEnv
			: 0.15
		: isPreview
			? Number.isFinite(tracesRateEnv)
				? tracesRateEnv
				: 0.3
			: 0, // dev off

	// Replay only outside dev, and keep prod modest
	replaysSessionSampleRate: isProd
		? Number.isFinite(replaysSessionRateEnv)
			? replaysSessionRateEnv
			: 0.05
		: isPreview
			? Number.isFinite(replaysSessionRateEnv)
				? replaysSessionRateEnv
				: 0.2
			: 0,

	replaysOnErrorSampleRate:
		isProd || isPreview
			? Number.isFinite(replaysOnErrorRateEnv)
				? replaysOnErrorRateEnv
				: 1
			: 0,

	// Never ship PII by default
	sendDefaultPii: false,

	// Helpful when you explicitly opt in during local troubleshooting
	debug: Boolean(process.env.NEXT_PUBLIC_SENTRY_DEBUG) && !isProd,

	// Extra guardrails
	ignoreErrors: [
		// add known noisy errors here if needed
	],
	denyUrls: isProd
		? [/^chrome-extension:\/\//, /extensions\//, /^moz-extension:\/\//]
		: [],

	beforeSend(event) {
		// If someone flipped the kill-switch at runtime via env injection
		if (!enabled) return null;

		// Example scrubber
		if (event.request?.headers) {
			delete event.request.headers.cookie;
			delete event.request.headers.authorization;
		}
		return event;
	},
});

// Next.js router transition helper
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
