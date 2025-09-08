import * as env from "./create-env";

// Export all exports as a default export
export default { ...env };

export type { EnvSchema } from "./create-env";
// Also export as named exports
export * from "./create-env";
