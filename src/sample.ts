import { defineEnv, host, port } from "./index";

const env = defineEnv({
	HOST: host,
	PORT: port.default("3000"),
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

console.log(env.HOST, env.PORT, env.NODE_ENV);
console.log(`${env.HOST}:${env.PORT} in ${env.NODE_ENV}`);
