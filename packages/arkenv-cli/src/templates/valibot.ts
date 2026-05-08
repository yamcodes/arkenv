export const valibotTemplate = (
	frameworkNote: string,
) => `import arkenv from "arkenv/standard";
import * as v from "valibot";

const Env = v.object({
	NODE_ENV: v.picklist(["development", "production", "test"]),
	PORT: v.pipe(v.string(), v.transform(Number), v.number(), v.minValue(1)),
});

/**
 * ArkEnv handles environment variable validation and type-safety.
 * \${frameworkNote}
 */
export const env = arkenv(Env);
`;
