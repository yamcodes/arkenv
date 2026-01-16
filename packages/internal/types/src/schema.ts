import type { $ } from "@repo/scope";
import type { Type } from "arktype";

export type SchemaShape = Record<string, unknown>;

/**
 * @internal
 *
 * Compiled ArkType schema accepted by ArkEnv.
 * Produced by `arktype.type(...)` or `scope(...)`.
 *
 * Represents an already-constructed ArkType `Type` instance that
 * defines the full environment schema.
 *
 * This form bypasses schema validation and is intended for advanced
 * or programmatic use cases where schemas are constructed dynamically.
 */
export type CompiledEnvSchema = Type<SchemaShape, $>;
