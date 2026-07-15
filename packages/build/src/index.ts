// Public import path for the build-time logging types. The implementation
// lives in the private `@repo/log` package; only the types consumers need to
// configure build-time logging (custom loggers, level thresholds) are exposed.
// These are strictly build-tool types: no runtime entry point of core,
// standard, or the integrations depends on them.
export type { Logger, LogLevel } from "@repo/log";
export * from "./core";
