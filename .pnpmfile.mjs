// Workaround for pnpm/pnpm#11701 on pnpm 11.9 (fixed in 11.21).
// Remove with #1944. Named `hooks` export is what pnpm 11 loads. No install hooks.
export const hooks = {};
