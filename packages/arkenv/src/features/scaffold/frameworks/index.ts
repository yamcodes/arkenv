import { bunFullstackStrategy } from "./bun-fullstack";
import { nextjsStrategy } from "./nextjs";
import { nuxtStrategy } from "./nuxt";
import type { FrameworkRegistry } from "./types";
import { vanillaStrategy } from "./vanilla";
import { viteStrategy } from "./vite";

/**
 * Exhaustive registry of framework strategies.
 */
export const FRAMEWORKS = {
	vite: viteStrategy,
	"bun-fullstack": bunFullstackStrategy,
	nextjs: nextjsStrategy,
	nuxt: nuxtStrategy,
	vanilla: vanillaStrategy,
} satisfies FrameworkRegistry;

export type { FrameworkStrategy } from "./types";
