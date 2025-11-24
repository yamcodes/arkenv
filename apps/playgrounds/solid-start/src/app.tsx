import { createSignal } from "solid-js";
import "./app.css";

export default function App() {
	const [count, setCount] = createSignal(0);

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
				<code>import.meta.env.VITE_TEST</code>: {import.meta.env.VITE_TEST} (of
				type {typeof import.meta.env.VITE_TEST})
				<br />
				<code>import.meta.env.VITE_NUMERIC</code>:{" "}
				{import.meta.env.VITE_NUMERIC} (of type{" "}
				{typeof import.meta.env.VITE_NUMERIC})
				<br />
				<code>import.meta.env.VITE_BOOLEAN</code>:{" "}
				{import.meta.env.VITE_BOOLEAN} (of type{" "}
				{typeof import.meta.env.VITE_BOOLEAN})
			</p>
		</main>
	);
}
