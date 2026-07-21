import arkenv from "@arkenv/core";

export const env = arkenv({
	DATABASE_URL: "string = 'postgres://localhost:5432/mydb'",
	VITE_API_URL: "string = 'https://api.example.com'",
	VITE_DEBUG: "boolean = false",
	VITE_PORT: "number = 3000",
	NODE_ENV: "'development' | 'production' | 'test' = 'test'",
});

export default env;
