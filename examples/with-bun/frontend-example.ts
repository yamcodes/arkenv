import arkenv from "arkenv";

// Example of Bun frontend environment variable usage
// Bun only exposes variables with BUN_PUBLIC_ prefix in frontend code

// Define our environment configuration using prefixed variables
const env = arkenv(
	{
		API_URL: "string",
		PORT: "number.port",
		NODE_ENV: "'development' | 'production' | 'test' = 'development'",
		DEBUG: "'true' | 'false' = 'false'", // String literal for env var
	},
	{
		// Use BUN_PUBLIC_ prefix - Bun will expose these variables in frontend
		prefix: "BUN_PUBLIC_",
	},
);

console.log("🌐 Frontend Environment Variables (Bun):");
console.log(`API URL: ${env.API_URL}`);
console.log(`Port: ${env.PORT}`);
console.log(`Environment: ${env.NODE_ENV}`);
console.log(`Debug Mode: ${env.DEBUG === "true"}`);

export default env;
