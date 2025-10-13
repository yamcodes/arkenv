import arkenv from "@arkenv/vite-plugin";
import react from "@vitejs/plugin-react";
import { type } from "arkenv";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		arkenv({
			VITE_MY_VAR: "string",
			VITE_MY_NUMBER: type("string").pipe((str) => Number.parseInt(str, 10)),
			VITE_MY_BOOLEAN: type("string").pipe((str) => str === "true"),
		}),
	],
});
