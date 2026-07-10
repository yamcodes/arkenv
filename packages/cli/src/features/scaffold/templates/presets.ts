import type { Framework, Validator } from "../plan";

export type HostPreset = "none" | "vercel" | "netlify";

/**
 * Get the framework-specific client prefix.
 */
export function getFrameworkPrefix(framework?: Framework): string {
	if (framework === "nextjs") return "NEXT_PUBLIC_";
	if (framework === "nuxt") return "NUXT_PUBLIC_";
	if (framework === "vite") return "VITE_";
	if (framework === "bun-fullstack") return "BUN_PUBLIC_";
	return "";
}

/**
 * Returns standard environment keys for the given hosting preset.
 */
export function getPresetKeys(preset: HostPreset, prefix: string): string[] {
	if (preset === "vercel") {
		const keys = ["VERCEL", "VERCEL_ENV", "VERCEL_URL"];
		if (prefix) {
			keys.push(`${prefix}VERCEL_ENV`, `${prefix}VERCEL_URL`);
		}
		return keys;
	}
	if (preset === "netlify") {
		const keys = ["NETLIFY", "CONTEXT", "URL", "DEPLOY_URL"];
		if (prefix) {
			keys.push(`${prefix}CONTEXT`, `${prefix}URL`);
		}
		return keys;
	}
	return [];
}

/**
 * Returns validator-specific schema fields for preset keys, falling back to a default optional string.
 */
export function getFieldDefinition(
	key: string,
	validator: Validator,
	prefix: string,
): string {
	if (key === "VERCEL_ENV" || (prefix && key === `${prefix}VERCEL_ENV`)) {
		if (validator === "arktype") {
			return `"'production' | 'preview' | 'development'?"`;
		}
		if (validator === "zod") {
			return `z.enum(["production", "preview", "development"]).optional()`;
		}
		if (validator === "valibot") {
			return `v.optional(v.picklist(["production", "preview", "development"]))`;
		}
	}

	if (key === "CONTEXT" || (prefix && key === `${prefix}CONTEXT`)) {
		if (validator === "arktype") {
			return `"'production' | 'deploy-preview' | 'branch-deploy'?"`;
		}
		if (validator === "zod") {
			return `z.enum(["production", "deploy-preview", "branch-deploy"]).optional()`;
		}
		if (validator === "valibot") {
			return `v.optional(v.picklist(["production", "deploy-preview", "branch-deploy"]))`;
		}
	}

	// Default optional string mapping
	if (validator === "arktype") {
		return `"string?"`;
	}
	if (validator === "zod") {
		return `z.string().optional()`;
	}
	if (validator === "valibot") {
		return `v.optional(v.string())`;
	}

	return "";
}
