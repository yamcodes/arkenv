import { useState } from "react";
import viteLogo from "/vite.svg";
import reactLogo from "./assets/react.svg";
import "./app.css";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<div>
				<a href="https://vite.dev" target="_blank" rel="noopener">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://react.dev" target="_blank" rel="noopener">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>Vite + React</h1>
			<div className="card">
				<button type="button" onClick={() => setCount((count) => count + 1)}>
					count is {count}
				</button>
				<p>
					Edit <code>src/app.tsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on the Vite and React logos to learn more
			</p>
			<h1>My env vars</h1>
			<p>
				My var: {String(import.meta.env.VITE_MY_VAR)} (of type{" "}
				{typeof import.meta.env.VITE_MY_VAR})
			</p>
			<p>
				My number: {String(import.meta.env.VITE_MY_NUMBER)} (of type{" "}
				{typeof import.meta.env.VITE_MY_NUMBER})
			</p>
			<p>
				My boolean: {String(import.meta.env.VITE_MY_BOOLEAN)} (of type{" "}
				{typeof import.meta.env.VITE_MY_BOOLEAN})
			</p>
		</>
	);
}

export default App;
