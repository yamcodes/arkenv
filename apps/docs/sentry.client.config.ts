// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Add optional integrations for additional features
	integrations: [Sentry.replayIntegration()],

	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate:
		process.env.NODE_ENV === "production"
			? (Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE_CLIENT) ??
				0.2)
			: 1,

	// Define how likely Replay events are sampled.
	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate:
		process.env.NODE_ENV === "production"
			? (Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE) ??
				0.1)
			: 1,

	// Define how likely Replay events are sampled when an error occurs.
	replaysOnErrorSampleRate:
		process.env.NODE_ENV === "production"
			? (Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE) ??
				1.0)
			: 1,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,
});
