import * as env from "./create-env";
import * as types from "./types";

// Export all exports as a default export
export default { ...env, ...types };

export type { EnvSchema } from "./create-env";
// Also export as named exports
export * from "./create-env";
export * from "./types";
