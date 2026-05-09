import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
	globalIgnores(["dist"]),
	js.configs.recommended,
	...tseslint.configs.recommended,
	reactHooks.configs.flat.recommended,
	reactRefresh.configs.vite,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			globals: globals.browser,
		},
	},
]);
