import { styleText } from "node:util";
import arkenv from "arkenv";

// Define our environment configuration
const env = arkenv({
	HOST: "string.host",
	PORT: "number.port",
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

// Pretty print the configuration
console.log(
	`🚀 Server running at ${styleText(["blue", "bold"], env.HOST)}:${styleText(["green", "bold"], String(env.PORT))} in ${styleText(
		"bold",
		env.NODE_ENV === "production"
			? styleText("red", env.NODE_ENV)
			: styleText("blue", env.NODE_ENV),
	)} mode`,
);

// This is just an example - in a real app you would use these values
// to configure your server or application
export default env;
