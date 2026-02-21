import { ArkEnvError } from "./errors";

/**
 * Throws if the given value is a string (ArkType DSL) in standard mode.
 * @internal
 */
export function assertNotArkTypeDsl(key: string, value: unknown): void {
	if (typeof value === "string") {
		throw new ArkEnvError([
			{
				path: key,
				message:
					'ArkType DSL strings are not supported in "standard" mode. Use a Standard Schema validator (e.g., Zod, Valibot) or set validator: "arktype".',
			},
		]);
	}
}

/**
 * Throws if the given value is not a well-formed Standard Schema validator
 * (must have a `~standard` property whose `validate` field is a function).
 * @internal
 */
export function assertStandardSchema(key: string, value: unknown): void {
	const std =
		value &&
		typeof value === "object" &&
		"~standard" in value &&
		(value as Record<string, unknown>)["~standard"];

	if (
		!std ||
		typeof std !== "object" ||
		!("validate" in std) ||
		typeof (std as Record<string, unknown>).validate !== "function"
	) {
		throw new ArkEnvError([
			{
				path: key,
				message:
					'Invalid validator: expected a Standard Schema 1.0 validator (must have "~standard" property). ArkType validators are not supported in "standard" mode. Use validator: "arktype" for ArkType schemas.',
			},
		]);
	}
}

/**
 * Throws if `def` is not a plain object (i.e. not a valid schema map).
 * @internal
 */
export function assertStandardSchemaMap(
	def: unknown,
): asserts def is Record<string, unknown> {
	if (!def || typeof def !== "object" || Array.isArray(def)) {
		throw new ArkEnvError([
			{
				path: "",
				message:
					'Invalid schema: expected an object mapping in "standard" mode.',
			},
		]);
	}
}
