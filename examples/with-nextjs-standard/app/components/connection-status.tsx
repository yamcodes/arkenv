"use client";

import { env } from "@/env";

/**
 * Typical leak: a Client Component copies a server-only env read
 * (connection string, "debug" status, etc.) into the browser graph.
 * Catch so the playground still builds; the message is the demo.
 */
export function ConnectionStatus() {
	try {
		return (
			<p style={{ margin: 0 }}>
				Connected to <code>{env.DATABASE_URL}</code>
			</p>
		);
	} catch (error) {
		return (
			<p style={{ margin: 0, color: "#b91c1c" }}>{(error as Error).message}</p>
		);
	}
}
