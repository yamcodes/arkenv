/**
 * Per-example `.env` defaults used when scaffolding a new project from a
 * repository example. Falls back to the framework strategy when an example
 * is not listed here.
 */
export const exampleEnvDefaults: Record<string, Record<string, string>> = {
	basic: {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"basic-js": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"with-bun": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"with-nextjs": {
		DATABASE_URL: "postgres://localhost:5432/mydb",
		NEXT_PUBLIC_API_URL: "https://api.example.com",
		NODE_ENV: "development",
	},
	"with-nextjs-strict": {
		DATABASE_URL: "postgres://localhost:5432/mydb",
		NEXT_PUBLIC_API_URL: "https://api.example.com",
		NODE_ENV: "development",
	},
	"with-nuxt": {
		DATABASE_URL: "postgres://localhost:5432/mydb",
		NUXT_PUBLIC_API_URL: "https://api.example.com",
		NODE_ENV: "development",
	},
	"with-vite-react": {
		PORT: "3000",
		VITE_MY_VAR: "hello",
		VITE_MY_NUMBER: "42",
		VITE_MY_BOOLEAN: "true",
	},
	"with-bun-react": {
		BUN_PUBLIC_API_URL: "https://api.example.com",
		BUN_PUBLIC_DEBUG: "true",
		NODE_ENV: "development",
	},
	"with-zod": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
	"with-standard-schema": {
		HOST: "localhost",
		PORT: "3000",
		NODE_ENV: "development",
	},
};

/**
 * Resolve example-specific env defaults for new project scaffolding.
 *
 * @param example The example template name.
 * @param frameworkFallback Defaults from the framework strategy when the
 *   example has no dedicated entry.
 * @returns Env var defaults for the example.
 */
export function getEnvDefaultsForExample(
	example: string,
	frameworkFallback: () => Record<string, string>,
): Record<string, string> {
	return exampleEnvDefaults[example] ?? frameworkFallback();
}
