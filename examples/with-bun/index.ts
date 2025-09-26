import arkenv from "arkenv";

// Define our environment configuration
const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

// Pretty print the configuration without using node:util for compatibility
console.log(
	`🚀 Server running at ${env.HOST}:${env.PORT} in ${env.NODE_ENV} mode`,
);

// This is just an example - in a real app you would use these values
// to configure your server or application
export default env;
