/**
 * Internal TypeScript/ArkType types shared across ArkEnv packages.
 *
 * This package is not published to npm and is intended for internal use only
 * within the monorepo.
 */

// Only TypeScript types
export type * from "./infer-type";

// Also includes ArkType types
export * from "./schema";
