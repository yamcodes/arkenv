import { loadArkTypeOrThrow } from "./utils";

export const type = new Proxy(() => {}, {
	get(target, prop) {
		return (loadArkTypeOrThrow().type as any)[prop];
	},
	apply(target, thisArg, argArray) {
		return (loadArkTypeOrThrow().type as any)(...argArray);
	},
}) as any;
