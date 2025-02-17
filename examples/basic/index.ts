import { blue, bold, green, red } from "ansis";
import ark, { host, port } from "ark.env";

const env = ark.env({
	HOST: host.default("localhost"),
	PORT: port.default("3000"),
	NODE_ENV: "'development' | 'production' | 'test' = 'development'",
});

// Automatically validate and parse process.env
// TypeScript knows the ✨exact✨ types!
console.log(env.HOST); // (property) HOST: string
console.log(env.PORT); // (property) PORT: number
console.log(env.NODE_ENV); // (property) NODE_ENV: "development" | "production" | "test"

export default env;
