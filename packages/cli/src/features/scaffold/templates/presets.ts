import type { Framework, HostPreset, Validator } from "../plan";

/**
 * Codegen IR for a single hosting-preset field.
 *
 * @remarks See `docs/adr/0014-cli-hosting-preset-field-metadata.md` (ADR 0014).
 * Do not grow this union without an explicit decision — prefer JSON Schema subset
 * or v1 dialect rendering if more field kinds are needed.
 */
export type PresetField =
	| { readonly type: "string" }
	| { readonly type: "enum"; readonly values: readonly string[] };

export type PresetDefinition = {
	readonly label: string;
	readonly hint: string;
	readonly serverOnlyKeys: readonly string[];
	readonly clientExposedKeys: readonly string[];
	readonly fields: Readonly<Record<string, PresetField>>;
};

export const PRESETS = {
	vercel: {
		label: "Vercel",
		hint: "Add VERCEL, VERCEL_ENV, VERCEL_URL, etc.",
		serverOnlyKeys: ["VERCEL"],
		clientExposedKeys: ["VERCEL_ENV", "VERCEL_URL"],
		fields: {
			VERCEL: { type: "string" },
			VERCEL_ENV: {
				type: "enum",
				values: ["production", "preview", "development"],
			},
			VERCEL_URL: { type: "string" },
		},
	},
	netlify: {
		label: "Netlify",
		hint: "Add NETLIFY, CONTEXT, URL, DEPLOY_URL, etc.",
		serverOnlyKeys: ["NETLIFY", "DEPLOY_URL"],
		clientExposedKeys: ["CONTEXT", "URL"],
		fields: {
			NETLIFY: { type: "string" },
			DEPLOY_URL: { type: "string" },
			CONTEXT: {
				type: "enum",
				values: ["production", "deploy-preview", "branch-deploy"],
			},
			URL: { type: "string" },
		},
	},
} satisfies Record<string, PresetDefinition>;

export type { HostPreset };

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
	const baseKey =
		prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;

	// Search all presets for this baseKey definition
	for (const def of Object.values(PRESETS)) {
		const fields = def.fields as Record<string, PresetField>;
		if (baseKey in fields) {
			const field = fields[baseKey];
			if (field.type === "string") {
				switch (validator) {
					case "arktype":
						return `"string?"`;
					case "zod":
						return "z.string().optional()";
					case "valibot":
						return "v.optional(v.string())";
					default: {
						const _exhaustiveCheck: never = validator;
						throw new Error(`Unsupported validator: ${_exhaustiveCheck}`);
					}
				}
			}
			if (field.type === "enum") {
				const values = field.values;
				switch (validator) {
					case "arktype":
						return `"'${values.join("' | '")}'?"`;
					case "zod":
						return `z.enum([${values.map((v: string) => `"${v}"`).join(", ")}]).optional()`;
					case "valibot":
						return `v.optional(v.picklist([${values.map((v: string) => `"${v}"`).join(", ")}]))`;
					default: {
						const _exhaustiveCheck: never = validator;
						throw new Error(`Unsupported validator: ${_exhaustiveCheck}`);
					}
				}
			}
		}
	}

	// Fallback to default optional string if not matched by any preset
	switch (validator) {
		case "arktype":
			return `"string?"`;
		case "zod":
			return "z.string().optional()";
		case "valibot":
			return "v.optional(v.string())";
		default: {
			const _exhaustiveCheck: never = validator;
			throw new Error(`Unsupported validator: ${_exhaustiveCheck}`);
		}
	}
}
