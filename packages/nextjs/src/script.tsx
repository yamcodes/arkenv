import type React from "react";

export type ArkEnvScriptProps = {
	/**
	 * Optional custom environment variable map. If provided, any keys starting
	 * with `NEXT_PUBLIC_` will be merged with public keys from `process.env`.
	 */
	env?: Record<string, string | undefined>;
};

/**
 * A React Component to serialize and inject NEXT_PUBLIC_* environment variables into the browser
 * during Server-Side Rendering (SSR). Placed in your root layout (layout.tsx), it sets
 * globalThis.__arkenv_env__ to ensure client-side components have access to runtime environment values.
 */
export function ArkEnvScript({
	env,
}: ArkEnvScriptProps = {}): React.ReactElement {
	const publicEnv: Record<string, string | undefined> = {};

	if (typeof process !== "undefined" && process.env) {
		for (const key of Object.keys(process.env)) {
			if (key.startsWith("NEXT_PUBLIC_")) {
				publicEnv[key] = process.env[key];
			}
		}
	}

	if (env) {
		for (const key of Object.keys(env)) {
			if (key.startsWith("NEXT_PUBLIC_")) {
				publicEnv[key] = env[key];
			}
		}
	}

	const scriptContent = `globalThis.__arkenv_env__ = ${JSON.stringify(publicEnv).replace(/</g, "\\u003c")};`;

	return (
		<script
			id="arkenv-script"
			// biome-ignore lint/security/noDangerouslySetInnerHTML: needed to inject the env variables script tag
			dangerouslySetInnerHTML={{ __html: scriptContent }}
		/>
	);
}
