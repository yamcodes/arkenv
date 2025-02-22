import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ValidateEnv as validateEnv } from "@julr/vite-plugin-validate-env";
import { type } from "arktype";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		validateEnv({
			validator: "standard",
			schema: {
				VITE_API_URL: type("string"),
			},
		}),
	],
});
