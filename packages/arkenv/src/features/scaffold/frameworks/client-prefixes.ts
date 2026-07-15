import type { Framework } from "@/features/scaffold/plan";
import { CODEGEN_FRAMEWORK_CONFIGS } from "./codegen-config";

/**
 * Canonical client env prefixes per framework.
 *
 * Assigned to each framework strategy's `clientPrefix`. Context creation reads
 * from here rather than the FRAMEWORKS registry to avoid a circular import.
 */
export const FRAMEWORK_CLIENT_PREFIXES = {
	nextjs: CODEGEN_FRAMEWORK_CONFIGS.nextjs.clientPrefix,
	nuxt: CODEGEN_FRAMEWORK_CONFIGS.nuxt.clientPrefix,
	vite: "VITE_",
	"bun-fullstack": "BUN_PUBLIC_",
	vanilla: "",
} as const satisfies Record<Framework, string>;
