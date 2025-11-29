export function coerce(
	def: Record<string, unknown>,
	env: Record<string, string | undefined>,
): Record<string, unknown> {
	const coerced: Record<string, unknown> = { ...env };

	for (const [key, typeDef] of Object.entries(def)) {
		const value = env[key];

		if (typeof value === "undefined") {
			continue;
		}

		if (typeof typeDef === "string") {
			if (typeDef.startsWith("number")) {
				const asNumber = Number(value);
				if (!Number.isNaN(asNumber)) {
					coerced[key] = asNumber;
				}
			} else if (typeDef === "boolean") {
				if (value === "true") {
					coerced[key] = true;
				} else if (value === "false") {
					coerced[key] = false;
				}
			}
		}
	}

	return coerced;
}
