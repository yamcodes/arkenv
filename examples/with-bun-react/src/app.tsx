import { APITester } from "./api-tester";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
	return (
		<div className="app">
			<div className="logo-container">
				<img src={logo} alt="Bun Logo" className="logo bun-logo" />
				<img src={reactLogo} alt="React Logo" className="logo react-logo" />
			</div>

			<h1>Bun + React</h1>
			<p>
				Edit <code>src/app.tsx</code> and save to test HMR
			</p>
			<APITester />
			<table className="env-table">
				<thead>
					<tr>
						<th>Variable</th>
						<th>Value</th>
						<th>Type</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>BUN_PUBLIC_API_URL</td>
						<td>{process.env.BUN_PUBLIC_API_URL}</td>
						<td>{typeof process.env.BUN_PUBLIC_API_URL}</td>
					</tr>
					<tr>
						<td>BUN_PUBLIC_DEBUG</td>
						<td>{String(process.env.BUN_PUBLIC_DEBUG)}</td>
						<td>{typeof process.env.BUN_PUBLIC_DEBUG}</td>
					</tr>
				</tbody>
			</table>
			{/* Print whether we are in "build" or in the dev server */}
			<p>Mode: {process.env.NODE_ENV}</p>
		</div>
	);
}

export default App;
