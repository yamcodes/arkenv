/// <reference types="vite/client" />

type ImportMetaEnvAugmented =
	import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
		typeof import("../vite.config").Env
	>;

interface ViteTypeOptions {
	// By adding this line, you can make the type of ImportMetaEnv strict
	// to disallow unknown keys.
	// See: https://vite.dev/guide/env-and-mode#intellisense-for-typescript
	// ⚠️ This option requires Vite 6.3.x or higher
	strictImportMetaEnv: unknown;
}

// Augment import.meta.env with your schema
// Only `VITE_*` prefixed variables will be included
interface ImportMetaEnv extends ImportMetaEnvAugmented {}
