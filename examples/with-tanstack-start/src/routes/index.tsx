import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { env } from "../env";

const readDatabaseUrl = createServerFn({ method: "GET" }).handler(() => {
	return env.DATABASE_URL;
});

export const Route = createFileRoute("/")({
	component: Home,
	loader: () => readDatabaseUrl(),
});

function tryReadServerKeyOnClient(): string {
	try {
		return `Server key leaked: ${env.DATABASE_URL}`;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

function Home() {
	const databaseUrl = Route.useLoaderData();
	const [clientReadResult, setClientReadResult] = useState<string | null>(null);

	return (
		<main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
			<h1>{env.VITE_APP_NAME}</h1>
			<p>
				Public key inlined into the client bundle: {env.VITE_APP_NAME} (release{" "}
				{env.VITE_APP_RELEASE})
			</p>
			<p>Server key loaded through createServerFn: {databaseUrl}</p>
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
