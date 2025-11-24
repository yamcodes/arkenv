/// <reference types="@solidjs/start/env" />

type ImportMetaEnvAugmented =
	import("@arkenv/vite-plugin").ImportMetaEnvAugmented<
		typeof import("../app.config").Env
	>;

// Augment import.meta.env with your schema
// Only `VITE_*` prefixed variables will be included
interface ImportMetaEnv extends ImportMetaEnvAugmented {}
