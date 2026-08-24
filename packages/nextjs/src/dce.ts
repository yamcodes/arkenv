/**
 * Evaluate whether an environment variable feature flag is enabled in a manner that
 * allows Next.js compilers (SWC/Turbopack) and minifiers (Terser/ESBuild) to perform
 * compile-time Dead-Code Elimination (DCE).
 *
 * @example
 * ```tsx
 * "use client";
 * import { isEnabled } from "@arkenv/nextjs";
 * import type { Env } from "@/env";
 *
 * export function FeatureComponent() {
 *   // SWC replaces `process.env.NEXT_PUBLIC_NEW_FEATURE` with `"false"`
 *   // Minifier evaluates `("false" === "true" || "false" === "1")` -> `false`
 *   // and drops the unused import and component from the client bundle!
 *   if (isEnabled<Env>("NEXT_PUBLIC_NEW_FEATURE", process.env.NEXT_PUBLIC_NEW_FEATURE)) {
 *     return <HeavyBetaModule />;
 *   }
 *   return <StandardModule />;
 * }
 * ```
 *
 * @param _key The feature flag key, strictly typed against your schema's keys
 * @param value The raw inlined identifier (e.g. `process.env.NEXT_PUBLIC_*`)
 * @returns `true` if the value is `"true"` or `"1"`, otherwise `false`
 */
export function isEnabled<
	TEnv extends Record<string, unknown> = Record<string, unknown>,
>(_key: keyof TEnv, value: string | boolean | undefined | null): boolean {
	return value === "true" || value === "1" || value === true;
}
