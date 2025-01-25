import { type } from "arktype";

type EmptyObject = Record<string, never>;
type AnyObject = Record<string, unknown>;

export const defineEnv = <
  const Def extends AnyObject,
  $ = EmptyObject
>(
  def: type.validate<Def, $>,
) => {
  // biome-ignore lint/suspicious/noExplicitAny: Must fix later
  const schema = type(def as any); // Create the schema
  const env = schema(process.env); // Validate process.env

  // Handle validation errors
  if (env instanceof type.errors) {
    console.error("Environment validation failed:", env.summary);
    process.exit(1);
  }

  console.log("Validation passed, success!");
  return env; // Return the validated and inferred environment
};
