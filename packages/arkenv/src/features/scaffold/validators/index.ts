import {
	arktypeStrategy,
	valibotStrategy,
	zodStrategy,
} from "./create-strategy";
import type { ValidatorRegistry } from "./types";

/**
 * Exhaustive registry of validator strategies.
 */
export const VALIDATORS = {
	arktype: arktypeStrategy,
	zod: zodStrategy,
	valibot: valibotStrategy,
} satisfies ValidatorRegistry;

export type { StrictEnvTemplates, ValidatorStrategy } from "./types";
export type { Dialect } from "./dialects";
export { DIALECTS } from "./dialects";
