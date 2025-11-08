// PostHog configuration constants
// Shared between next.config.ts (server) and instrumentation-client.ts (client)

/**
 * Proxy path prefix for PostHog analytics ingestion.
 * This unique path helps bypass ad blockers.
 */
export const POSTHOG_PROXY_PREFIX = "/ph_a7k3nv";

/**
 * PostHog API endpoint for EU region.
 * Used for proxying analytics requests.
 */
export const POSTHOG_API_ENDPOINT = "https://eu.i.posthog.com";

/**
 * PostHog assets host for EU region.
 * Used for proxying static assets (toolbar, etc.).
 */
export const POSTHOG_ASSETS_HOST = "https://eu-assets.i.posthog.com";

/**
 * PostHog UI host for EU region.
 * Used for linking to PostHog dashboard.
 */
export const POSTHOG_UI_HOST = "https://eu.posthog.com";
