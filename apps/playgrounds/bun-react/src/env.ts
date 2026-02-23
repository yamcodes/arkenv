import { type } from "arkenv";

export default type({
	BUN_PUBLIC_API_URL: "string.url",
	BUN_PUBLIC_DEBUG: "boolean",
	NODE_ENV: "'development' | 'production' | 'test'",
});
