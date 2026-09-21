// pnpm 11.9 can fail nested `pnpm run` when this default file is missing
// (fixed in 11.21). No install hooks.
export default {
	hooks: {},
};
