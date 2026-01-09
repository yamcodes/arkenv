import type { $ } from "@repo/scope";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { distill, Type, type } from "arktype";

/**
 * Extract the inferred type from an ArkType type definition or a Standard Schema validator.
 *
 * @template T - The schema definition to infer from
 */
export type InferType<T> =
	T extends StandardSchemaV1<infer U>
		? U
		: T extends Type<infer U, unknown>
			? distill.Out<U>
			: T extends { t: infer U }
				? distill.Out<U>
				: T extends { infer: infer U }
					? distill.Out<U>
					: T extends (value: unknown) => infer R
						? R extends type.errors
							? never
							: distill.Out<R>
						: T extends string
							? distill.Out<type.infer<T, $>>
							: T extends object
								? distill.Out<type.infer<T, $>>
								: T;
