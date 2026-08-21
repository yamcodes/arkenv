import "@getdashfy/ui/styles.css";

import { ThemeRegistry } from "@getdashfy/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

ThemeRegistry.loadAllThemes();

const root = document.getElementById("root");

if (!root) {
	throw new Error("Root element #root is missing");
}

createRoot(root).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
