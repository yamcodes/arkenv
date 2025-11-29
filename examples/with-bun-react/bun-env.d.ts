/// <reference types="bun-types" />

// Import the Env schema type from env.ts
type ProcessEnvAugmented = import("@arkenv/bun-plugin").ProcessEnvAugmented<
	typeof import("./src/env").default
>;

declare namespace NodeJS {
	interface ProcessEnv extends ProcessEnvAugmented {}
}

declare module "*.svg" {
	const content: string;
	export default content;
}

declare module "*.module.css" {
	const classes: { readonly [key: string]: string };
	export default classes;
}
