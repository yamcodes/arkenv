import { getSchemaKeys } from "@repo/utils";

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
	 * Whether a default is detectable on this key.
	 *
	 * Standard Schema v1 has no default concept, so this is best-effort: ArkType
	 * DSL/`json.default`, Zod `_def.defaultValue` / `type: "default"`, and
	 * Valibot own `default` / `fallback` fields. Unknown validators report false.
	 */
	hasDefault: boolean;
};

type CompiledKeyEntry = {
	key?: string;
	value?: unknown;
	default?: unknown;
};

/** Own-key check compatible with es2020 (no `Object.hasOwn`) and noPrototypeBuiltins. */
function hasOwn(object: object, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(object, key);
}

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
	if (hasOwn(value, "default") || hasOwn(value, "fallback")) {
		return true;
	}

	const def = value._def;
	if (def && typeof def === "object") {
		const inner = def as Record<string, unknown>;
		if (
			"defaultValue" in inner ||
			inner.typeName === "ZodDefault" ||
			inner.type === "default"
		) {
			return true;
		}
		if ("innerType" in inner) {
			return schemaHasDefault(inner.innerType);
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
 * Push compiled ArkType `json.required` / `json.optional` entries as per-key metadata.
 *
 * @param entries Compiled key descriptors (array or map)
 * @param keys Accumulated declared keys
 * @param schema Accumulated per-key schema map
 */
function pushCompiledEntries(
	entries: unknown,
	keys: DeclaredSchemaKey[],
	schema: Record<string, unknown>,
): void {
	if (!entries) {
		return;
	}
	if (Array.isArray(entries)) {
		for (const entry of entries) {
			if (Array.isArray(entry) && typeof entry[0] === "string") {
				keys.push({
					name: entry[0],
					schema: entry[1],
					hasDefault: false,
				});
				schema[entry[0]] = entry[1];
				continue;
			}
			if (entry && typeof entry === "object") {
				const compiled = entry as CompiledKeyEntry;
				const name = compiled.key;
				if (typeof name !== "string") {
					continue;
				}
				const perKeySchema = "value" in compiled ? compiled.value : undefined;
				keys.push({
					name,
					schema: perKeySchema,
					hasDefault: hasOwn(compiled, "default"),
				});
				schema[name] = perKeySchema;
			}
		}
		return;
	}
	if (typeof entries === "object") {
		for (const [name, value] of Object.entries(
			entries as Record<string, unknown>,
		)) {
			const inner =
				value && typeof value === "object"
					? (value as CompiledKeyEntry)
					: undefined;
			const perKeySchema = inner && "value" in inner ? inner.value : value;
			keys.push({
				name,
				schema: perKeySchema,
				hasDefault: Boolean(inner && hasOwn(inner, "default")),
			});
			schema[name] = perKeySchema;
		}
	}
}

/**
 * Convert captured `arkenv()` definitions into ordered key metadata.
 *
 * An empty captured object (`arkenv({})`) yields `keys: []` — that is a valid
 * empty schema, not a load failure.
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
		if (
			!definition ||
			(typeof definition !== "object" && typeof definition !== "function")
		) {
			continue;
		}

		const record = definition as Record<string, unknown>;
		const jsonRaw = record.json;
		const json =
			typeof jsonRaw === "function" ? (jsonRaw as () => unknown)() : jsonRaw;
		const before = keys.length;
		if (json && typeof json === "object") {
			const compiled = json as {
				domain?: string;
				required?: unknown;
				optional?: unknown;
			};
			if (
				compiled.domain === "object" ||
				compiled.required !== undefined ||
				compiled.optional !== undefined
			) {
				pushCompiledEntries(compiled.required, keys, schema);
				pushCompiledEntries(compiled.optional, keys, schema);
				if (keys.length > before) {
					continue;
				}
			}
		}

		const compiledNames = json ? getSchemaKeys(definition) : [];
		if (keys.length === before && compiledNames.length > 0) {
			for (const name of compiledNames) {
				keys.push({ name, schema: undefined, hasDefault: false });
				schema[name] = undefined;
			}
			continue;
		}

		if (keys.length > before) {
			continue;
		}

		if (typeof definition === "function") {
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
