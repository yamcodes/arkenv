import { env } from "../env.server";
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
