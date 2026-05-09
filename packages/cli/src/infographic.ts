import pc from "picocolors";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

export function printInfographic() {
	const version = pkg.version;
	const libraryVersion = "0.11.0"; // Current monorepo version

	// Raw strings for length calculation
	const titleRaw = "⛯ ArkEnv CLI";
	const line1Raw = `cli:     v${version}`;
	const line2Raw = `library: v${libraryVersion} (latest)`;
	const line3Raw = "docs:    arkenv.js.org";

	const width = 50;
	const contentWidth = width - 4; // 2 for border, 2 for padding

	const pad = (str: string, raw: string) => {
		const padding = contentWidth - raw.length;
		return str + " ".repeat(Math.max(0, padding));
	};

	const title = `${pc.blue("⛯")} ${pc.bold("ArkEnv CLI")}`;
	const line1 = `${pc.dim("cli:")}     ${pc.cyan(`v${version}`)}`;
	const line2 = `${pc.dim("library:")} ${pc.cyan(`v${libraryVersion}`)} ${pc.dim("(latest)")}`;
	const line3 = `${pc.dim("docs:")}    ${pc.blue("arkenv.js.org")}`;

	const box = [
		pc.blue(`╭${"─".repeat(width - 2)}╮`),
		`${pc.blue("│")} ${pad(title, titleRaw)} ${pc.blue("│")}`,
		`${pc.blue("│")} ${" ".repeat(contentWidth)} ${pc.blue("│")}`,
		`${pc.blue("│")} ${pad(line1, line1Raw)} ${pc.blue("│")}`,
		`${pc.blue("│")} ${pad(line2, line2Raw)} ${pc.blue("│")}`,
		`${pc.blue("│")} ${pad(line3, line3Raw)} ${pc.blue("│")}`,
		pc.blue(`╰${"─".repeat(width - 2)}╯`),
	].join("\n");

	console.log(`\n${box}\n`);
}
