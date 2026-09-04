import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { env } from "../env";

const getDatabaseHost = createServerFn({ method: "GET" }).handler(() => {
	// Server functions can safely read server secrets without leaking them to the client:
	const url = new URL(env.DATABASE_URL);
	return url.host;
});

export const Route = createFileRoute("/")({
	component: Home,
	loader: () => getDatabaseHost(),
});

function tryReadServerKeyOnClient(): string {
	try {
		return `Server key leaked: ${env.DATABASE_URL}`;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

function Home() {
	const dbHost = Route.useLoaderData();
	const [clientReadResult, setClientReadResult] = useState<string | null>(null);

	return (
		<main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
			<h1>API: {env.VITE_API_URL}</h1>
			<p>Public key inlined into the client bundle: {env.VITE_API_URL}</p>
			<p>Database host loaded through createServerFn: {dbHost}</p>
			<button
				type="button"
				onClick={() => setClientReadResult(tryReadServerKeyOnClient())}
			>
				Try reading DATABASE_URL on the client
			</button>
			{clientReadResult ? <p>{clientReadResult}</p> : null}
		</main>
	);
}
