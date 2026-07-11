import { type } from "@arkenv/core";

/**
 * @internal 🛑 INTERNAL SCHEMA ONLY.
 * Do not import this directly. Import `env` from `./client` or `./server` instead.
 */
export const SharedSchema = type({
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});
