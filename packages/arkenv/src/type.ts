import { $ } from "@repo/scope";

/**
 * A re-export of ArkType's `type` function scoped with ArkEnv's built-in validators.
 *
 * Use this to define environment variable schemas with built-in types like `host`, `port`, `url`, and `email`,
 * or create your own custom type definitions.
 *
 * @example
 * ```ts
 * import { type } from 'arkenv';
 *
 * const schema = type({
 *   HOST: 'string.host',
 *   PORT: 'number.port',
 *   NODE_ENV: "'development' | 'production' | 'test'",
 * });
 * ```
 *
 * @see {@link https://arktype.io/docs | ArkType Documentation}
 */
export const type = $.type;
