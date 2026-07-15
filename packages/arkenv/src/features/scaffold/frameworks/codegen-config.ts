import type { Framework } from "@/features/scaffold/plan";

/**
 * Configuration for frameworks that emit codegen-aware env schemas
 * (Next.js and Nuxt).
 */
export type CodegenFrameworkConfig = {
	id: "nextjs" | "nuxt";
	packageName: "@arkenv/nextjs" | "@arkenv/nuxt";
	clientPrefix: "NEXT_PUBLIC_" | "NUXT_PUBLIC_";
	displayName: "Next.js" | "Nuxt";
	/** When true, bootstrap wraps next.config (Next.js only). */
	supportsWrapNextjsConfig: boolean;
};

/**
 * Canonical Next.js / Nuxt package names, client prefixes, and display names.
 * All scaffold code that needs these values should read from here.
 */
export const CODEGEN_FRAMEWORK_CONFIGS = {
	nextjs: {
		id: "nextjs",
		packageName: "@arkenv/nextjs",
		clientPrefix: "NEXT_PUBLIC_",
		displayName: "Next.js",
		supportsWrapNextjsConfig: true,
	},
	nuxt: {
		id: "nuxt",
		packageName: "@arkenv/nuxt",
		clientPrefix: "NUXT_PUBLIC_",
		displayName: "Nuxt",
		supportsWrapNextjsConfig: false,
	},
} as const satisfies Record<"nextjs" | "nuxt", CodegenFrameworkConfig>;

/**
 * Resolve the codegen framework config for a framework id.
 *
 * @param framework The selected framework.
 * @returns Config when the framework is Next.js or Nuxt; otherwise undefined.
 */
export function getCodegenConfig(
	framework: Framework,
): CodegenFrameworkConfig | undefined {
	if (framework === "nextjs" || framework === "nuxt") {
		return CODEGEN_FRAMEWORK_CONFIGS[framework];
	}
	return undefined;
}

/**
 * Whether the framework uses codegen-aware env schema packages.
 *
 * @param framework The selected framework.
 * @returns True for Next.js and Nuxt.
 */
export function isCodegenFramework(
	framework: Framework,
): framework is "nextjs" | "nuxt" {
	return framework === "nextjs" || framework === "nuxt";
}
