import { FRAMEWORK_CLIENT_PREFIXES } from "@/features/scaffold/frameworks/client-prefixes";
import { getCodegenConfig } from "@/features/scaffold/frameworks/codegen-config";
import type { Framework, ProjectOptions } from "./plan";
import type { HostPreset } from "./presets";

/**
 * Shared context passed to validator strategies during template generation.
 */
export type ScaffoldContext = {
	framework: Framework;
	/** Client env prefix from the active framework strategy (e.g. `NEXT_PUBLIC_`, `VITE_`). */
	clientPrefix: string;
	/** Integration package name when the framework is codegen-aware. */
	packageName?: string;
	disableCodegen: boolean;
	layout?: "strict" | "simple" | "flat";
	nextjsImportPath?: string;
	/** Hosting provider preset for schema field enrichment. */
	hostPreset?: HostPreset;
};

/**
 * Build a {@link ScaffoldContext} from project options and optional import path.
 *
 * Client prefix comes from {@link FRAMEWORK_CLIENT_PREFIXES}, the same source
 * each framework strategy exposes as `clientPrefix`. Package name still comes
 * from codegen framework config for Next/Nuxt.
 *
 * @param options The selected project options
 * @param nextjsImportPath The optional custom import path for generated env files
 * @returns A scaffold context for validator strategies
 */
export function createScaffoldContext(
	options: ProjectOptions,
	nextjsImportPath?: string,
): ScaffoldContext {
	const codegen = getCodegenConfig(options.framework);

	return {
		framework: options.framework,
		clientPrefix: FRAMEWORK_CLIENT_PREFIXES[options.framework],
		...(codegen?.packageName !== undefined && {
			packageName: codegen.packageName,
		}),
		disableCodegen: options.disableCodegen === true,
		...(options.layout !== undefined && { layout: options.layout }),
		...(nextjsImportPath !== undefined && { nextjsImportPath }),
		...(options.hostPreset !== undefined && {
			hostPreset: options.hostPreset,
		}),
	};
}
