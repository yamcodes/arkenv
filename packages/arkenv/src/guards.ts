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
 * Throws if the given value does not have a `~standard` property (i.e. is not a Standard Schema validator).
 * @internal
 */
export function assertStandardSchema(key: string, value: unknown): void {
	if (!value || typeof value !== "object" || !("~standard" in value)) {
		throw new ArkEnvError([
			{
				path: key,
				message:
					'Invalid validator: expected a Standard Schema 1.0 validator (must have "~standard" property). ArkType validators are not supported in "standard" mode. Use validator: "arktype" for ArkType schemas.',
			},
		]);
	}
}
