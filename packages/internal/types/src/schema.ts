import type { $ } from "@repo/scope";
import type { Type } from "arktype";
import type { StandardSchemaV1 } from "./standard-schema";

/**
 * A schema shape representing a mapping of string keys to unknown values.
 * This is a pure TypeScript type and does not require ArkType at runtime.
 */
export type SchemaShape = Record<string, unknown>;

/**
 * A schema definition that is either an ArkType Type or a Standard Schema validator.
 */
export type EnvSchemaWithType =
	| Type<SchemaShape, $>
	| StandardSchemaV1<SchemaShape>;
