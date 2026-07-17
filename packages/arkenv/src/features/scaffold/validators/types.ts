import type { Validator } from "@/features/scaffold/plan";
import type { ScaffoldContext } from "@/features/scaffold/scaffold-context";

export type StrictEnvTemplates = {
	shared: string;
	client: string;
	server: string;
};

/**
 * Validator-specific scaffolding operations for env schema templates.
 */
export type ValidatorStrategy = {
	/**
	 * Format a single schema field for the given role.
	 *
	 * @param key The environment variable name.
	 * @param role Whether the field belongs to client, server, or shared scope.
	 * @param context Shared scaffold context including framework details.
	 * @returns A formatted schema field string.
	 */
	formatField(
		key: string,
		role: "client" | "server" | "shared",
		context: ScaffoldContext,
	): string;

	/**
	 * Generate a single-file env schema template.
	 *
	 * @param keys Environment variable keys to include in the schema.
	 * @param context Shared scaffold context.
	 * @returns The generated template source code.
	 */
	getSimpleTemplate(keys: string[], context: ScaffoldContext): string;

	/**
	 * Generate shared, client, and server templates for strict layouts.
	 *
	 * @param keys Environment variable keys to include in the schema.
	 * @param context Shared scaffold context.
	 * @returns Templates for all three strict-layout files.
	 */
	getStrictTemplates(
		keys: string[],
		context: ScaffoldContext,
	): StrictEnvTemplates;
};

/**
 * Exhaustive registry of validator strategies keyed by validator name.
 */
export type ValidatorRegistry = Record<Validator, ValidatorStrategy>;
