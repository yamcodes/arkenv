import { env } from "@/env";
import ClientComponent from "./client-component";

export default function Home() {
	return (
		<main
			style={{
				padding: "40px",
				fontFamily: "sans-serif",
				maxWidth: "600px",
				margin: "0 auto",
			}}
		>
			<h1>ArkEnv Next.js Playground</h1>
			<p>
				Demonstrating compile-time and runtime validation for Next.js
				environment variables.
			</p>
			<p>
				The client panel can read <code>NEXT_PUBLIC_*</code> and{" "}
				<code>NODE_ENV</code>. Click the red button to read{" "}
				<code>DATABASE_URL</code> instead — the throw is a native{" "}
				<code>Error</code> with{" "}
				<code>name = &quot;ArkEnvAccessError&quot;</code>.
			</p>

			<div
				style={{
					padding: "16px",
					border: "1px solid #cbd5e1",
					borderRadius: "8px",
				}}
			>
				<h3>Server Component Context</h3>
				<p>
					<strong>Database URL:</strong> <code>{env.DATABASE_URL}</code>
				</p>
				<p>
					<strong>API URL:</strong> <code>{env.NEXT_PUBLIC_API_URL}</code>
				</p>
				<p>
					<strong>Node Env:</strong> <code>{env.NODE_ENV}</code>
				</p>
			</div>

			<ClientComponent />
		</main>
	);
}
