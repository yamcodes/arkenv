/**
 * Codegen IR for a single hosting-preset field.
 *
 * @remarks See `docs/adr/0018-cli-hosting-preset-field-metadata.md` (ADR 0018).
 * Do not grow this union without an explicit decision — prefer JSON Schema subset
 * or richer dialect rendering if more field kinds are needed.
 */
export type PresetField =
	| { readonly type: "string" }
	| { readonly type: "enum"; readonly values: readonly string[] };

/**
 * Declarative metadata for a hosting-provider preset.
 */
export type PresetDefinition = {
	readonly label: string;
	readonly hint: string;
	readonly serverOnlyKeys: readonly string[];
	readonly clientExposedKeys: readonly string[];
	readonly fields: Readonly<Record<string, PresetField>>;
};

/**
 * Hosting preset registry. Adding a host is one place: entry + field metadata.
 */
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
} as const satisfies Record<string, PresetDefinition>;

/**
 * Hosting preset id including the explicit opt-out (`"none"`).
 *
 * Derived from {@link PRESETS} so adding a host stays a single registry edit.
 */
export type HostPreset = "none" | keyof typeof PRESETS;

/**
 * Type-guard for CLI / flag values against {@link HostPreset}.
 *
 * @param value Raw CLI string
 * @returns Whether `value` is a known host preset id
 */
export function isHostPreset(value: string): value is HostPreset {
	return value === "none" || value in PRESETS;
}

/**
 * Collect environment keys for a hosting preset, including client-prefixed copies.
 *
 * @param preset Selected hosting preset (`"none"` yields an empty list)
 * @param clientPrefix Framework client prefix from the active strategy (e.g. `NEXT_PUBLIC_`)
 * @returns Deduplicated key list for schema and `.env` planning
 */
export function getPresetKeys(
	preset: HostPreset,
	clientPrefix: string,
): string[] {
	if (preset === "none") return [];
	const def = PRESETS[preset];
	const keys: string[] = [...def.serverOnlyKeys, ...def.clientExposedKeys];
	if (clientPrefix) {
		for (const key of def.clientExposedKeys) {
			keys.push(`${clientPrefix}${key}`);
		}
	}
	return keys;
}

/**
 * Look up preset field metadata for a schema key, stripping the client prefix when present.
 *
 * @param key Environment variable name (possibly prefixed)
 * @param clientPrefix Framework client prefix used to recover the base key
 * @returns Matching {@link PresetField}, or `undefined` when the key is not from a preset
 */
export function lookupPresetField(
	key: string,
	clientPrefix: string,
): PresetField | undefined {
	const baseKey =
		clientPrefix && key.startsWith(clientPrefix)
			? key.slice(clientPrefix.length)
			: key;

	for (const def of Object.values(PRESETS)) {
		const fields = def.fields as Readonly<Record<string, PresetField>>;
		if (baseKey in fields) {
			return fields[baseKey];
		}
	}
	return undefined;
}

/**
 * Merge detected env keys with hosting-preset keys without dropping either set.
 *
 * @param envKeys Keys already chosen (e.g. from `.env.example`); may be undefined
 * @param hostPreset Selected hosting preset
 * @param clientPrefix Framework client prefix from the active strategy
 * @returns Combined unique keys, or `undefined` when both sources are empty
 */
export function mergeEnvKeysWithPreset(
	envKeys: string[] | undefined,
	hostPreset: HostPreset | undefined,
	clientPrefix: string,
): string[] | undefined {
	const presetKeys = getPresetKeys(hostPreset ?? "none", clientPrefix);
	if (!envKeys?.length && presetKeys.length === 0) {
		return undefined;
	}
	return Array.from(new Set([...(envKeys ?? []), ...presetKeys]));
}
