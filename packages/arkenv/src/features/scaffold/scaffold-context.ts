import type { Framework, ProjectOptions } from "./plan";

/**
 * Shared context passed to validator strategies during template generation.
 */
export type ScaffoldContext = {
	framework: Framework;
	clientPrefix: string;
	disableCodegen: boolean;
	layout?: "strict" | "simple" | "flat";
	nextjsImportPath?: string;
};

/**
 * Build a {@link ScaffoldContext} from project options and optional import path.
 *
 * @param options The selected project options.
 * @param nextjsImportPath The optional custom import path for generated env files.
 * @returns A scaffold context for validator strategies.
 */
export function createScaffoldContext(
	options: ProjectOptions,
	nextjsImportPath?: string,
): ScaffoldContext {
	const clientPrefix =
		options.framework === "nuxt" ? "NUXT_PUBLIC_" : "NEXT_PUBLIC_";

	return {
		framework: options.framework,
		clientPrefix,
		disableCodegen: options.disableCodegen === true,
		...(options.layout !== undefined && { layout: options.layout }),
		...(nextjsImportPath !== undefined && { nextjsImportPath }),
	};
}
