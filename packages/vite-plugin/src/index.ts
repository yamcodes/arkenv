import ark from "ark.env";
import type { type } from "arktype";
import type { Plugin } from "vite";

// This is the same `EnvSchema` type as in `ark.env`.
// We are re-defining it here since TypeScript loses inference when using the type from `ark.env`.
// TODO: Fix this. We shouldn't have to re-define the type here.
type EnvSchema<
	T extends Record<string, string | undefined> = Record<
		string,
		string | undefined
	>,
> = type.validate<T>;

export default <T extends EnvSchema>(options: EnvSchema<T>): Plugin => ({
	name: "@arkenv/vite-plugin",
	config() {
		ark.env(options);
	},
});
