import { useState } from "react";
import viteLogo from "/vite.svg";
import reactLogo from "./assets/react.svg";
import "./App.css";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<div>
				<a href="https://vite.dev" target="_blank" rel="noreferrer">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://react.dev" target="_blank" rel="noreferrer">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Vite + React</h1>
			<div className="card">
				<button type="button" onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<div className="env-vars">
				<p>Test Variable: {import.meta.env.VITE_TEST}</p>
				<p>API URL: {import.meta.env.VITE_API_URL}</p>
				<p>Port: {import.meta.env.VITE_PORT}</p>
				<p>Debug Mode: {import.meta.env.VITE_DEBUG ? "enabled" : "disabled"}</p>
				<p>Environment: {import.meta.env.VITE_NODE_ENV}</p>
			</div>
			<p className="read-the-docs">
				Click on the Vite and React logos to learn more
			</p>
		</>
	);
}

export default App;
