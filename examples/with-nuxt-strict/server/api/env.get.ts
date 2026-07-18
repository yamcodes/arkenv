/**
 * Playground-only Nitro smoke route.
 *
 * Not part of ArkEnv setup. Any real server file that imports `~~/env/server`
 * would exercise the same Nitro alias wiring; this exists so the fixture app
 * has one such import without needing a full feature surface.
 */
import { env } from "~~/env/server";

export default defineEventHandler(() => env);
