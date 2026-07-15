import type { ProjectOptions } from "./plan";
import { createScaffoldContext } from "./scaffold-context";
import { VALIDATORS } from "./validators";

export type { StrictEnvTemplates } from "./validators";

/**
 * Generate the complete environment configuration template
 * based on the user's chosen validator and framework.
 *
 * @param options The selected project options.
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js.
 * @returns The generated template code.
 */
export function getEnvTemplate(
	options: ProjectOptions,
	nextjsImportPath?: string,
): string {
	const validator = VALIDATORS[options.validator];
	if (!validator) {
		throw new Error(`Unsupported validator: ${options.validator}`);
	}

	const context = createScaffoldContext(options, nextjsImportPath);
	return validator.getSimpleTemplate(options.envKeys ?? [], context);
}

/**
 * Generate the shared, client, and server environment configuration templates
 * for the 3-file Strict Next.js layout.
 *
 * @param options The selected project options.
 * @param nextjsImportPath The optional custom import path for the generated file in Next.js.
 * @returns The generated templates for all three files.
 */
export function getStrictEnvTemplates(
	options: ProjectOptions,
	nextjsImportPath?: string,
) {
	const validator = VALIDATORS[options.validator];
	if (!validator) {
		throw new Error(`Unsupported validator: ${options.validator}`);
	}

	const context = createScaffoldContext(options, nextjsImportPath);
	return validator.getStrictTemplates(options.envKeys ?? [], context);
}
