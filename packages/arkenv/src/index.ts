import * as env from "./define-env";
import * as types from "./types";

// Export all exports as a default export
export default { ...env, ...types };

export type { EnvSchema } from "./define-env";
// Also export as named exports
export * from "./define-env";
export * from "./types";
