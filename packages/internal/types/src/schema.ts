import { type } from "arktype";

export const SchemaShape = type({ "[string]": "unknown" });
export type SchemaShape = typeof SchemaShape.infer;
export type EnvSchemaWithType = typeof SchemaShape;
