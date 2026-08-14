"use client";

import { env } from "@/env";

/**
 * Typical leak: a Client Component copies a server-only env read
 * (connection string, "debug" status, etc.) into the browser graph.
 */
export function ConnectionStatus() {
	return (
		<p style={{ margin: 0 }}>
			Connected to <code>{env.DATABASE_URL}</code>
		</p>
	);
}
