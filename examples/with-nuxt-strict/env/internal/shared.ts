import { type } from "@arkenv/core";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import `env` from `./client` or `./server` instead.
 * Automatically picked up by `@arkenv/nuxt/client` when `extends` is omitted;
 * `@arkenv/nuxt/server` includes it through the composed client env.
 */
export const SharedSchema = type({
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
