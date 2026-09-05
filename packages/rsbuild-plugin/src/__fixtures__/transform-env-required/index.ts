import { env } from "./env";

export function readSecretToken() {
	return env.SECRET_TOKEN;
}
