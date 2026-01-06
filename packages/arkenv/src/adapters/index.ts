/**
 * Normalised issue format for ArkEnv
 */
export type EnvIssue = {
	path: string[];
	message: string;
	validator: "arktype" | "standard";
};

/**
 * Universal adapter for validator logic
 */
export interface SchemaAdapter {
	readonly kind: "arktype" | "standard";
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
