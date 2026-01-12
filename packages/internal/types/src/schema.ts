import type { $ } from "@repo/scope";
import { type Type, type } from "arktype";
import type { StandardSchemaV1 } from "./standard-schema";

export const SchemaShape = type({ "[string]": "unknown" });
export type SchemaShape = typeof SchemaShape.infer;

/**
 * A schema definition that is either an ArkType Type or a Standard Schema validator.
 */
export type EnvSchemaWithType =
	| Type<SchemaShape, $>
	| StandardSchemaV1<SchemaShape>;
