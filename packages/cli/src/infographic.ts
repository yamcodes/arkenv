import pc from "picocolors";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

export function printInfographic() {
	const version = pkg.version;
	
	const logo = [
		`    ${pc.blue("█")}       ${pc.bold(`ArkEnv CLI v${version}`)}`,
		`   ${pc.blue("▞▀▚")}      ${pc.dim("Type-safe environment variables")}`,
		`   ${pc.cyan("┃")} ${pc.yellow("●")} ${pc.cyan("┃")}     ${pc.dim("from editor to runtime")}`,
		`   ${pc.blue("▙▄▟")}`,
		`   ${pc.blue("█▄█")}`,
		`  ${pc.blue("▟███▙")}`,
		` ${pc.blue("▟█████▙")}`,
	].join("\n");

	console.log(`\n${logo}\n`);
}
