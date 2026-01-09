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
		: T extends Type<any, any>
			? any
			: T extends { t: any }
				? any
				: T extends { infer: any }
					? any
					: T extends (value: any) => infer R
						? R extends type.errors
							? never
							: distill.Out<R>
						: T extends string
							? distill.Out<type.infer<T, $>>
							: T extends object
								? { [K in keyof T]: InferType<T[K]> }
								: T;
