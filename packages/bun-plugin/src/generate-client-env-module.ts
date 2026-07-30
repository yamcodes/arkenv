/**
 * Build the client-graph replacement module: inlined coerced literals + server-key guards.
 *
 * No validator import is emitted. See ADR 0021 (env-object canonical surface) —
 * contributors must not reintroduce `env.gen.ts`, client-side re-validation, or
 * `runtimeEnv` wiring on hosts that own their transform.
 *
 * @param clientValues Coerced values for client and shared keys
 * @param serverKeys Server-only keys that must throw when read on the client
 * @returns The transformed module source
 */
export function generateClientEnvModule(
	clientValues: Record<string, unknown>,
	serverKeys: string[],
): string {
	const lines: string[] = ["const env = {"];

	for (const [key, value] of Object.entries(clientValues)) {
		lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
	}

	for (const key of serverKeys) {
		const message = `ArkEnv Error: Attempted to access server environment variable '${key}' on the client.`;
		lines.push(
			`  get [${JSON.stringify(key)}]() {`,
			`    throw new Error(${JSON.stringify(message)});`,
			"  },",
		);
	}

	lines.push("};", "export { env };", "export default env;", "");
	return lines.join("\n");
}
