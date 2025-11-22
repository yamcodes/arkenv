/// <reference types="vite/client" />

type ImportMetaEnvAugmented =
	import("@julr/vite-plugin-validate-env").ImportMetaEnvAugmented<
		typeof import("../env").default
	>;

interface ViteTypeOptions {
	// Avoid adding an index type to `ImportMetaDev` so
	// there's an error when accessing unknown properties.
	// ⚠️ This option requires Vite 6.3.x or higher
	strictImportMetaEnv: unknown;
}

// Now import.meta.env is totally typesafe and based on your `Env` schema definition
interface ImportMetaEnv extends ImportMetaEnvAugmented {}
