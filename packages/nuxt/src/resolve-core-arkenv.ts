import type { Dict, SchemaShape } from "@repo/types";
import { createJiti } from "jiti";

type CoreArkenv = (
	schema: SchemaShape,
	config?: { env?: Dict<string>; safe?: boolean },
) => Record<string, unknown>;

/**
 * Resolve the core validation function for the configured engine.
 *
 * Uses Jiti so optional peers (`@arkenv/core` / `@arkenv/standard`) load
 * synchronously without a static import that would force both packages.
 *
 * @param engine ArkType (`@arkenv/core`) or Standard Schema (`@arkenv/standard`)
 * @returns The engine's `arkenv` function
 */
export function resolveCoreArkenv(engine: "arktype" | "standard"): CoreArkenv {
	const jiti = createJiti(import.meta.url);
	if (engine === "standard") {
		return (jiti("@arkenv/standard") as { arkenv: CoreArkenv }).arkenv;
	}
	return (jiti("@arkenv/core") as { arkenv: CoreArkenv }).arkenv;
}
