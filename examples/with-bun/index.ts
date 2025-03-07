import chalk from "chalk";
import ark, { host, port } from "ark.env";

// Define our environment configuration
const env = ark.env({
	HOST: host.default("localhost"),
	PORT: port.default("3000"),
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

// Pretty print the configuration
console.log(
	`🚀 Server running at ${chalk.bold(chalk.blue(env.HOST))}:${chalk.bold(
		chalk.green(env.PORT),
	)} in ${chalk.bold(
		env.NODE_ENV === "production"
			? chalk.red(env.NODE_ENV)
			: chalk.blue(env.NODE_ENV),
	)} mode`,
);

// This is just an example - in a real app you would use these values
// to configure your server or application
export default env;
