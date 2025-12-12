import type { $ } from "@repo/scope";
import type { Type } from "arktype";

export type SchemaShape = Record<string, unknown>;
export type EnvSchemaWithType = Type<SchemaShape, (typeof $)["t"]>;
