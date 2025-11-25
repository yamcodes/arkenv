/// <reference types="bun-types" />

// Import the Env schema type from env.ts
// Note: In a real project, you might want to export Env from a separate env.ts file
// and import it like: typeof import("./env").Env
type ProcessEnvAugmented = import("@arkenv/bun-plugin").ProcessEnvAugmented<
	typeof import("./bun-env").Env
>;

declare global {
	namespace NodeJS {
		interface ProcessEnv extends ProcessEnvAugmented {}
	}
}

declare module "*.svg" {
	/**
	 * A path to the SVG file
	 */
	const path: `${string}.svg`;
	export = path;
}

declare module "*.module.css" {
	/**
	 * A record of class names to their corresponding CSS module classes
	 */
	const classes: { readonly [key: string]: string };
	export = classes;
}
