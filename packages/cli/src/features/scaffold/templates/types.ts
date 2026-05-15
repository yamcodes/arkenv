import path from "node:path";
import dedent from "dedent";

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
