import { arktypeStrategy } from "./arktype";
import type { ValidatorRegistry } from "./types";
import { valibotStrategy } from "./valibot";
import { zodStrategy } from "./zod";

/**
 * Exhaustive registry of validator strategies.
 */
export const VALIDATORS = {
	arktype: arktypeStrategy,
	zod: zodStrategy,
	valibot: valibotStrategy,
} satisfies ValidatorRegistry;

export type { StrictEnvTemplates, ValidatorStrategy } from "./types";
