/**
 * Type helper for augmenting `process.env` with typesafe environment variables.
 *
 * Use this type to add TypeScript autocomplete and type-safety for your validated
 * environment variables in Bun projects. It automatically filters variables based
 * on the configured prefix (defaults to `BUN_PUBLIC_`).
 *
 * @see {@link https://arkenv.js.org/integrations/bun | Bun Plugin Documentation}
 */
export { arkenv, hybrid } from "./plugin";
export type { ProcessEnvAugmented } from "./types";
export { processEnvSchema } from "./utils";

import { hybrid } from "./plugin";
export default hybrid;
