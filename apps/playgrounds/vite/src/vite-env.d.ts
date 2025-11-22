/// <reference types="vite/client" />

// Import the Env schema type from vite.config.ts
// Note: In a real project, you might want to export Env from a separate env.ts file
// and import it like: import type { Env } from "./env";
type ImportMetaEnvAugmented =
	import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
		typeof import("../vite.config").Env
	>;

interface ViteTypeOptions {
	// Avoid adding an index type to `ImportMetaDev` so
	// there's an error when accessing unknown properties.
	// ⚠️ This option requires Vite 6.3.x or higher
	strictImportMetaEnv: unknown;
}

// Now import.meta.env is totally typesafe and based on your `Env` schema definition
// Only VITE_* prefixed variables will be included (PORT is excluded)
interface ImportMetaEnv extends ImportMetaEnvAugmented {}
