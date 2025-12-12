import type { $ } from "@repo/scope";
import { type Type, type } from "arktype";

export const SchemaShape = type({ "[string]": "unknown" });

// Same thing as `typeof SchemaShape.infer` but more performant
export type SchemaShape = Record<string, unknown>;

export type EnvSchemaWithType = Type<SchemaShape, (typeof $)["t"]>;
