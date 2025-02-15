import ark, { host, port } from "ark.env";
import { blue, bold, green, red } from "picocolors";

// Define our environment configuration
const env = ark.env({
	HOST: host.default("localhost"),
	PORT: port.default("3000"),
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
	MY_ENV_VAR: "string",
});

// Pretty print the configuration
console.log(
	`🚀 Server running at ${bold(blue(env.HOST))}:${bold(green(env.PORT))} in ${bold(
		env.NODE_ENV === "production" ? red(env.NODE_ENV) : blue(env.NODE_ENV),
	)} mode`,
);

// This is just an example - in a real app you would use these values
// to configure your server or application
export default env;

console.log(env.MY_ENV_VAR);
