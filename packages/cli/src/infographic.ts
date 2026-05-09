import { createRequire } from "node:module";
import pc from "picocolors";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

export function printInfographic() {
	const version = pkg.version;

	const logo = [
		` ${pc.cyan("▝▜▄")}     ${pc.bold(`ArkEnv CLI v${version}`)}`,
		`   ${pc.cyan("▝▜▄")}`,
		`  ${pc.blue("▗▟▀")}    ${pc.dim("Type-safe environment variables")}`,
		` ${pc.blue("▝▀")}      ${pc.dim("from editor to runtime")}`,
	].join("\n");

	console.log(`\n${logo}\n`);
}
