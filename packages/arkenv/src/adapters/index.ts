/**
 * Normalised issue format for ArkEnv.
 * This shape is stable across all validators (ArkType, Standard Schema, etc.).
 * Treat this as an invariant for future tooling, CLI formatting, or IDE integrations.
 */
export type EnvIssue = {
	/**
	 * The path to the failing key as an array of strings.
	 * Empty array means root Level.
	 */
	path: string[];
	/**
	 * The localized or validator-specific error message.
	 */
	message: string;
	/**
	 * The kind of validator that produced this error.
	 */
	validator: "arktype" | "standard";
};

export interface SchemaAdapter {
	/**
	 * The internal identity of the adapter.
	 */
	readonly kind: "arktype" | "standard";

	/**
	 * Validate a record of environment variables.
	 */
	validate(env: Record<string, string | undefined>):
		| {
				success: true;
				value: unknown;
		  }
		| {
				success: false;
				issues: EnvIssue[];
		  };
}
