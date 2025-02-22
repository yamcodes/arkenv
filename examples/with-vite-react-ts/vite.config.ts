import { ValidateEnv as validateEnv } from "@julr/vite-plugin-validate-env";
import react from "@vitejs/plugin-react";
import { type } from "arktype";
import { defineConfig } from "vite";

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
