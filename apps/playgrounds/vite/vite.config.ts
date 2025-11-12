import ArkEnv from "@arkenv/vite-plugin";
import React from "@vitejs/plugin-react";
import arkenv, { type } from "arkenv";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	const env = arkenv(
		{
			PORT: "number.port",
			VITE_MY_VAR: "string",
			VITE_MY_NUMBER: type("string").pipe((str) => Number.parseInt(str, 10)),
			VITE_MY_BOOLEAN: type("string").pipe((str) => str === "true"),
		},
		loadEnv(mode, process.cwd(), ""),
	);
	return {
		plugins: [
			React(),
			ArkEnv({
				PORT: "number.port",
				VITE_MY_VAR: "string",
				VITE_MY_NUMBER: type("string").pipe((str) => Number.parseInt(str, 10)),
				VITE_MY_BOOLEAN: type("string").pipe((str) => str === "true"),
			}),
		],
		server: {
			port: env.PORT,
		},
	};
});
