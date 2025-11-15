import { APITester } from "./APITester";
import { EnvDisplay } from "./EnvDisplay";
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

			<h1>Bun + R eact</h1>
			<p>
				Edit <code>src/App.t sx</code> and save to test HMR
			</p>
			<APITester />
			<EnvDisplay />
		</div>
	);
}

export default App;
