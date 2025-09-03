import * as env from "./env";
import * as types from "./types";

// Export all exports as a default export
export default { ...env, ...types };

// Also export as named exports
export * from "./env";
export * from "./types";

export type { EnvSchema } from "./env";
