type Validator = "arktype" | "zod" | "valibot";
type Framework = "vite" | "bun-fullstack" | "vanilla" | "nextjs" | "nuxt";

export const PRESETS = {
	vercel: {
		label: "Vercel",
		hint: "Add VERCEL, VERCEL_ENV, VERCEL_URL, etc.",
		serverOnlyKeys: ["VERCEL"],
		clientExposedKeys: ["VERCEL_ENV", "VERCEL_URL"],
		fields: {
			VERCEL: {
				arktype: `"string?"`,
				zod: `z.string().optional()`,
				valibot: `v.optional(v.string())`,
			},
			VERCEL_ENV: {
				arktype: `"'production' | 'preview' | 'development'?"`,
				zod: `z.enum(["production", "preview", "development"]).optional()`,
				valibot: `v.optional(v.picklist(["production", "preview", "development"]))`,
			},
			VERCEL_URL: {
				arktype: `"string?"`,
				zod: `z.string().optional()`,
				valibot: `v.optional(v.string())`,
			},
		},
	},
	netlify: {
		label: "Netlify",
		hint: "Add NETLIFY, CONTEXT, URL, DEPLOY_URL, etc.",
		serverOnlyKeys: ["NETLIFY", "DEPLOY_URL"],
		clientExposedKeys: ["CONTEXT", "URL"],
		fields: {
			NETLIFY: {
				arktype: `"string?"`,
				zod: `z.string().optional()`,
				valibot: `v.optional(v.string())`,
			},
			DEPLOY_URL: {
				arktype: `"string?"`,
				zod: `z.string().optional()`,
				valibot: `v.optional(v.string())`,
			},
			CONTEXT: {
				arktype: `"'production' | 'deploy-preview' | 'branch-deploy'?"`,
				zod: `z.enum(["production", "deploy-preview", "branch-deploy"]).optional()`,
				valibot: `v.optional(v.picklist(["production", "deploy-preview", "branch-deploy"]))`,
			},
			URL: {
				arktype: `"string?"`,
				zod: `z.string().optional()`,
				valibot: `v.optional(v.string())`,
			},
		},
	},
} as const;

export type HostPreset = "none" | keyof typeof PRESETS;

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
	if (preset === "none") return [];
	const def = PRESETS[preset];
	if (!def) return [];
	const keys: string[] = [...def.serverOnlyKeys, ...def.clientExposedKeys];
	if (prefix) {
		for (const key of def.clientExposedKeys) {
			keys.push(`${prefix}${key}`);
		}
	}
	return keys;
}

/**
 * Returns validator-specific schema fields for preset keys, falling back to a default optional string.
 */
export function getFieldDefinition(
	key: string,
	validator: Validator,
	prefix: string,
): string {
	// Strip prefix if the key is a client exposed key
	const baseKey = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;

	// Search all presets for this baseKey definition
	for (const def of Object.values(PRESETS)) {
		const fields = def.fields as Record<string, Record<Validator, string>>;
		if (baseKey in fields) {
			const field = fields[baseKey];
			if (validator === "arktype") return field.arktype;
			if (validator === "zod") return field.zod;
			if (validator === "valibot") return field.valibot;
			
			const _exhaustiveCheck: never = validator;
			throw new Error(`Unsupported validator: ${_exhaustiveCheck}`);
		}
	}

	// Fallback to default optional string if not matched by any preset
	if (validator === "arktype") return `"string?"`;
	if (validator === "zod") return `z.string().optional()`;
	if (validator === "valibot") return `v.optional(v.string())`;

	const _exhaustiveCheck: never = validator;
	throw new Error(`Unsupported validator: ${_exhaustiveCheck}`);
}
