/**
 * One declared environment variable extracted from a captured `arkenv()` schema.
 */
export type DeclaredSchemaKey = {
	/**
	 * Environment variable name, without a trailing ArkType `?` optional marker
	 */
	name: string;
	/**
	 * Per-key schema or validator from the definition object
	 */
	schema: unknown;
	/**
	 * Whether the schema declares a default value
	 */
	hasDefault: boolean;
};

/**
 * Detect whether a per-key schema declares a default.
 *
 * @param schema The per-key schema or validator
 * @returns `true` when a default is detectable
 */
export function schemaHasDefault(schema: unknown): boolean {
	if (typeof schema === "string") {
		return /=\s*\S/.test(schema);
	}
	if (!schema || typeof schema !== "object") {
		return false;
	}

	const value = schema as Record<string, unknown>;
	const def = value._def;
	if (def && typeof def === "object") {
		const inner = def as Record<string, unknown>;
		if ("defaultValue" in inner || inner.typeName === "ZodDefault") {
			return true;
		}
		if ("innerType" in inner) {
			return schemaHasDefault(inner.innerType);
		}
	}

	const zod = value._zod;
	if (zod && typeof zod === "object") {
		const zdef = (zod as { def?: { type?: string; innerType?: unknown } }).def;
		if (zdef?.type === "default") {
			return true;
		}
		if (zdef?.innerType) {
			return schemaHasDefault(zdef.innerType);
		}
	}

	return false;
}

/**
 * Strip a trailing ArkType optional marker from a schema key.
 *
 * @param key Raw object key from the schema definition
 * @returns The environment variable name
 */
export function declaredKeyName(key: string): string {
	return key.endsWith("?") ? key.slice(0, -1) : key;
}

/**
 * Convert captured `arkenv()` definitions into ordered key metadata.
 *
 * @param definitions Schema objects recorded during capture
 * @returns Ordered keys and a combined schema map
 */
export function declaredKeysFromDefinitions(definitions: unknown[]): {
	keys: DeclaredSchemaKey[];
	schema: Record<string, unknown>;
} {
	const keys: DeclaredSchemaKey[] = [];
	const schema: Record<string, unknown> = {};

	for (const definition of definitions) {
		if (!definition || typeof definition !== "object") {
			continue;
		}

		const record = definition as Record<string, unknown>;
		const json = record.json;
		if (
			json &&
			typeof json === "object" &&
			(json as { domain?: string }).domain === "object"
		) {
			const compiled = json as {
				required?: { key?: string }[];
				optional?: { key?: string }[];
			};
			const compiledKeys: string[] = [];
			for (const entry of compiled.required ?? []) {
				if (
					entry &&
					typeof entry === "object" &&
					typeof entry.key === "string"
				) {
					compiledKeys.push(entry.key);
				}
			}
			for (const entry of compiled.optional ?? []) {
				if (
					entry &&
					typeof entry === "object" &&
					typeof entry.key === "string"
				) {
					compiledKeys.push(entry.key);
				}
			}
			for (const name of compiledKeys) {
				keys.push({ name, schema: definition, hasDefault: false });
				schema[name] = definition;
			}
			continue;
		}

		for (const [rawKey, value] of Object.entries(record)) {
			const name = declaredKeyName(rawKey);
			keys.push({
				name,
				schema: value,
				hasDefault: schemaHasDefault(value),
			});
			schema[name] = value;
		}
	}

	return { keys, schema };
}
