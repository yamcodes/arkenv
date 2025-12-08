import type { $ } from "@repo/scope";
import { type Type, type } from "arktype";

export const SchemaShape = type({ "[string]": "unknown" });
export type SchemaShape = typeof SchemaShape.infer;
export type EnvSchemaWithType = Type<SchemaShape, (typeof $)["t"]>;
