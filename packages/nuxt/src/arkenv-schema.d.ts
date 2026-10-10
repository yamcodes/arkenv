/**
 * Nitro virtual module. `@arkenv/nuxt/module` supplies the source at build time.
 * The server bundle inlines the captured schema; this module is not a runtime file.
 */
declare module "#arkenv/schema" {
	import type { SchemaShape } from "@repo/types";
	import type { BootGateEngine, CoreArkenv } from "./boot-gate-apply";

	/**
	 * Load the schema captured while the bundled user module evaluated.
	 */
	export function loadBundledSchema(): {
		schema: SchemaShape;
		publicKeys: string[];
		engine: BootGateEngine;
		coreArkenv: CoreArkenv;
	};
}
