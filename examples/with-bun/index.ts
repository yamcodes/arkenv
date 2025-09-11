import arkenv from "arkenv";
import { blue, bold, green, red } from "yoctocolors";

// Define our environment configuration
const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

// Pretty print the configuration
console.log(
	`🚀 Server running at ${bold(blue(env.HOST))}:${bold(
		green(env.PORT),
	)} in ${bold(
		env.NODE_ENV === "production" ? red(env.NODE_ENV) : blue(env.NODE_ENV),
	)} mode`,
);

// This is just an example - in a real app you would use these values
// to configure your server or application
export default env;
