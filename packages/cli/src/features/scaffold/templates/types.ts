import path from "node:path";
import dedent from "dedent";

/**
 * Generates the Vite types template (vite-env.d.ts) to augment `import.meta.env`.
 *
 * @param envPath The path to the environment schema file.
 * @returns The generated TypeScript declarations.
 */
export const viteTypesTemplate = (envPath: string) => {
	const envFileName = path.basename(envPath).replace(/\.(ts|js|tsx|jsx)$/, "");
	return dedent /* ts */`
		/// <reference types="vite/client" />

		type ImportMetaEnvAugmented =
			import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
				typeof import("./${envFileName}").Env
			>;

		interface ImportMetaEnv extends ImportMetaEnvAugmented {}

		interface ImportMeta {
			readonly env: ImportMetaEnv;
		}
	`;
};

/**
 * Generates the Bun types template (bun-env.d.ts) to augment `process.env`.
 *
 * @param envPath The path to the environment schema file.
 * @returns The generated TypeScript declarations.
 */
export const bunTypesTemplate = (envPath: string) => {
	const envFileName = path.basename(envPath).replace(/\.(ts|js|tsx|jsx)$/, "");
	return dedent /* ts */`
		/// <reference types="bun-types" />

		type ProcessEnvAugmented = import("@arkenv/bun-plugin").ProcessEnvAugmented<
			typeof import("./${envFileName}").Env
		>;

		declare namespace NodeJS {
			interface ProcessEnv extends ProcessEnvAugmented {}
		}
	`;
};
