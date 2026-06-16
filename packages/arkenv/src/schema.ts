/**
 * Extract the keys from a schema definition dynamically.
 * Supports plain objects, ArkType schemas, and Standard Schema validators.
 *
 * @param schema The schema definition to extract keys from
 * @returns An array of extracted key names
 * @internal
 */
// biome-ignore lint/suspicious/noExplicitAny: Need to handle various schema formats
export function getSchemaKeys(schema: any): string[] {
	if (!schema || (typeof schema !== "object" && typeof schema !== "function")) {
		return [];
	}

	// ArkType Type
	if (
		schema.json &&
		typeof schema.json === "object" &&
		schema.json.domain === "object"
	) {
		const keys: string[] = [];
		if (Array.isArray(schema.json.required)) {
			for (const r of schema.json.required) {
				if (r && typeof r === "object" && "key" in r) {
					keys.push(r.key);
				}
			}
		}
		if (Array.isArray(schema.json.optional)) {
			for (const o of schema.json.optional) {
				if (o && typeof o === "object" && "key" in o) {
					keys.push(o.key);
				}
			}
		}
		return keys;
	}

	// Standard Schema / JSON Schema fallback
	const std = schema["~standard"];
	const jsonSchemaInput =
		(typeof std?.jsonSchema?.input === "function" && std.jsonSchema.input) ||
		(typeof schema.jsonSchema?.input === "function" && schema.jsonSchema.input);

	if (jsonSchemaInput) {
		try {
			const json = jsonSchemaInput({ target: "draft-07" });
			if (json && typeof json === "object" && json.properties) {
				return Object.keys(json.properties);
			}
		} catch {}
	}

	if (typeof schema.toJSONSchema === "function") {
		try {
			const json = schema.toJSONSchema();
			if (json && typeof json === "object" && json.properties) {
				return Object.keys(json.properties);
			}
		} catch {}
	}

	if (typeof schema.toStandardJSONSchema?.v1 === "function") {
		try {
			const json = schema.toStandardJSONSchema.v1();
			if (json && typeof json === "object" && json.properties) {
				return Object.keys(json.properties);
			}
		} catch {}
	}

	// Plain object schema
	return Object.keys(schema);
}
