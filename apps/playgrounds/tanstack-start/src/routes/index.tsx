import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { SecretLeakButton } from "~/components/secret-leak-button";
import { env } from "~/env";

const getDatabaseHost = createServerFn({ method: "GET" }).handler(() => {
	// Server functions can safely read server secrets without leaking them to the client:
	const url = new URL(env.DATABASE_URL);
	return url.host;
});

export const Route = createFileRoute("/")({
	component: Home,
	loader: () => getDatabaseHost(),
});

function Home() {
	const dbHost = Route.useLoaderData();

	return (
		<main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
			<h1>API: {env.VITE_API_URL}</h1>
			<p>Public key inlined into the client bundle: {env.VITE_API_URL}</p>
			<p>Database host loaded through createServerFn: {dbHost}</p>
			<SecretLeakButton />
		</main>
	);
}
