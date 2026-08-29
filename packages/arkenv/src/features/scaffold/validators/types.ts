import type { Validator } from "@/features/scaffold/plan";
import type { ScaffoldContext } from "@/features/scaffold/scaffold-context";

/**
 * Validator-specific scaffolding operations for env schema templates.
 */
export type ValidatorStrategy = {
	/**
	 * Generate a single-file env schema template.
	 *
	 * @param keys Environment variable keys to include in the schema.
	 * @param context Shared scaffold context.
	 * @returns The generated template source code.
	 */
	getSimpleTemplate(keys: string[], context: ScaffoldContext): string;
};

/**
 * Exhaustive registry of validator strategies keyed by validator name.
 */
export type ValidatorRegistry = Record<Validator, ValidatorStrategy>;
