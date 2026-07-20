import { createSignal } from "solid-js";
import { env } from "./env";
import "./app.css";

const serverDatabaseUrl =
	typeof window === "undefined" ? env.DATABASE_URL : null;

export default function App() {
	const [count, setCount] = createSignal(0);
	const [serverError, setServerError] = createSignal<string | null>(null);

	return (
		<main>
			<h1>Hello world!</h1>
			<button
				class="increment"
				onClick={() => setCount(count() + 1)}
				type="button"
			>
				Clicks: {count()}
			</button>
			<p>
				Visit{" "}
				<a
					href="https://start.solidjs.com"
					target="_blank"
					rel="noopener noreferrer"
				>
					start.solidjs.com
				</a>{" "}
				to learn how to build SolidStart apps.
				<br />
				<br />
				<code>env.VITE_TEST</code>: {String(env.VITE_TEST)} (of type{" "}
				{typeof env.VITE_TEST})
				<br />
				<code>env.VITE_NUMERIC</code>: {String(env.VITE_NUMERIC)} (of type{" "}
				{typeof env.VITE_NUMERIC})
				<br />
				<code>env.VITE_BOOLEAN</code>: {String(env.VITE_BOOLEAN)} (of type{" "}
				{typeof env.VITE_BOOLEAN})
				<br />
				{serverDatabaseUrl ? (
					<>
						<code>env.DATABASE_URL</code> (SSR): {serverDatabaseUrl}
						<br />
					</>
				) : null}
				<br />
				<button
					type="button"
					onClick={() => {
						try {
							void env.DATABASE_URL;
							setServerError(null);
						} catch (error) {
							setServerError(
								error instanceof Error ? error.message : String(error),
							);
						}
					}}
				>
					Read env.DATABASE_URL on the client
				</button>
				{serverError() ? (
					<>
						<br />
						<code>{serverError()}</code>
					</>
				) : null}
			</p>
		</main>
	);
}
