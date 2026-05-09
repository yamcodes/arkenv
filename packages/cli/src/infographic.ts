import pc from "picocolors";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

export function printInfographic() {
	const version = pkg.version;
	const dir = process.cwd().replace(process.env.HOME || "", "~");

	// Raw strings for length calculation
	const titleRaw = `⛯ ArkEnv CLI (v${version})`;
	const line1Raw = `runtime:   ${process.release?.name || "node"} ${process.version}`;
	const line2Raw = `directory: ${dir}`;

	const width = 60;
	const contentWidth = width - 4; // 2 for border, 2 for padding

	const pad = (str: string, raw: string) => {
		const padding = contentWidth - raw.length;
		return str + " ".repeat(Math.max(0, padding));
	};

	const title = `${pc.blue("⛯")} ${pc.bold("ArkEnv CLI")} ${pc.dim(`(v${version})`)}`;
	const line1 = `${pc.dim("runtime:")}   ${pc.cyan(process.release?.name || "node")} ${pc.dim(process.version)}`;
	const line2 = `${pc.dim("directory:")} ${pc.cyan(dir)}`;

	const box = [
		pc.blue(`╭${"─".repeat(width - 2)}╮`),
		`${pc.blue("│")} ${pad(title, titleRaw)} ${pc.blue("│")}`,
		`${pc.blue("│")} ${" ".repeat(contentWidth)} ${pc.blue("│")}`,
		`${pc.blue("│")} ${pad(line1, line1Raw)} ${pc.blue("│")}`,
		`${pc.blue("│")} ${pad(line2, line2Raw)} ${pc.blue("│")}`,
		pc.blue(`╰${"─".repeat(width - 2)}╯`),
	].join("\n");

	console.log(`\n${box}\n`);
}
