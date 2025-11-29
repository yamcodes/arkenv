// Import the Env schema type from env.ts
type ProcessEnvAugmented = import("@arkenv/bun-plugin").ProcessEnvAugmented<
	typeof import("./src/env").default
>;

declare namespace NodeJS {
	interface ProcessEnv extends ProcessEnvAugmented {}
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
