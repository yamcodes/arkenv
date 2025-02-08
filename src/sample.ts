import { blue, bold, green, red } from "picocolors";
import { defineEnv, host, port } from "ark.env";

const env = defineEnv({
	HOST: host,
	PORT: port.default("3000"),
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

console.log(
	`🚀 Server running at ${bold(blue(env.HOST))}:${bold(green(env.PORT))} in ${bold(
		env.NODE_ENV === "production" ? red(env.NODE_ENV) : blue(env.NODE_ENV),
	)} mode`,
);
