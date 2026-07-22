import type { Framework, HostPreset, Validator } from "../plan";

/**
 * Codegen IR for a single hosting-preset field.
 *
 * @remarks See `docs/adr/0014-cli-hosting-preset-field-metadata.md` (ADR 0014).
 * Do not grow this union without an explicit decision - prefer JSON Schema subset
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
	cloudflare: {
		label: "Cloudflare Pages/Workers",
		hint: "Add CF_PAGES, CF_PAGES_COMMIT_SHA, CF_PAGES_BRANCH, CF_PAGES_URL, etc.",
		serverOnlyKeys: ["CF_PAGES", "CF_PAGES_COMMIT_SHA"],
		clientExposedKeys: ["CF_PAGES_BRANCH", "CF_PAGES_URL"],
		fields: {
			CF_PAGES: { type: "string" },
			CF_PAGES_COMMIT_SHA: { type: "string" },
			CF_PAGES_BRANCH: { type: "string" },
			CF_PAGES_URL: { type: "string" },
		},
	},
	railway: {
		label: "Railway",
		hint: "Add RAILWAY_ENVIRONMENT, RAILWAY_STATIC_URL, RAILWAY_GIT_COMMIT_SHA, etc.",
		serverOnlyKeys: [
			"RAILWAY_ENVIRONMENT",
			"RAILWAY_STATIC_URL",
			"RAILWAY_GIT_COMMIT_SHA",
		],
		clientExposedKeys: [],
		fields: {
			RAILWAY_ENVIRONMENT: { type: "string" },
			RAILWAY_STATIC_URL: { type: "string" },
			RAILWAY_GIT_COMMIT_SHA: { type: "string" },
		},
	},
	render: {
		label: "Render",
		hint: "Add RENDER, RENDER_SERVICE_ID, RENDER_SERVICE_TYPE, RENDER_EXTERNAL_URL, etc.",
		serverOnlyKeys: [
			"RENDER",
			"RENDER_SERVICE_ID",
			"RENDER_SERVICE_TYPE",
			"RENDER_EXTERNAL_URL",
		],
		clientExposedKeys: [],
		fields: {
			RENDER: { type: "string" },
			RENDER_SERVICE_ID: { type: "string" },
			RENDER_SERVICE_TYPE: { type: "string" },
			RENDER_EXTERNAL_URL: { type: "string" },
		},
	},
	fly: {
		label: "Fly.io",
		hint: "Add FLY_APP_NAME, FLY_REGION, FLY_ALLOC_ID, etc.",
		serverOnlyKeys: ["FLY_APP_NAME", "FLY_REGION", "FLY_ALLOC_ID"],
		clientExposedKeys: [],
		fields: {
			FLY_APP_NAME: { type: "string" },
			FLY_REGION: { type: "string" },
			FLY_ALLOC_ID: { type: "string" },
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
 * Partitions hosting preset keys into client-facing (prefixed) vs server-only keys for strict layouts.
 */
export function partitionPresetKeys(
	preset: HostPreset,
	frameworkOrPrefix: Framework | string,
): { clientKeys: string[]; serverKeys: string[] } {
	if (preset === "none") {
		return { clientKeys: [], serverKeys: [] };
	}
	const def = PRESETS[preset];
	if (!def) {
		return { clientKeys: [], serverKeys: [] };
	}

	const prefix =
		frameworkOrPrefix.endsWith("_") || frameworkOrPrefix === ""
			? frameworkOrPrefix
			: getFrameworkPrefix(frameworkOrPrefix as Framework);

	const serverKeys: string[] = [
		...def.serverOnlyKeys,
		...def.clientExposedKeys,
	];
	const clientKeys: string[] = [];

	if (prefix) {
		for (const key of def.clientExposedKeys) {
			clientKeys.push(`${prefix}${key}`);
		}
	}

	return { clientKeys, serverKeys };
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
