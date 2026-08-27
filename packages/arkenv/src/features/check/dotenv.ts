/**
 * Unescape double-quoted string escape sequences.
 *
 * Uses a single-pass token replacement so escaped backslashes (`\\`)
 * are preserved correctly and do not interfere with subsequent escape sequences.
 *
 * @param value The raw string inside double quotes
 * @returns The unescaped string
 */
function unescapeDoubleQuoted(value: string): string {
	return value.replace(/\\([nrtbfv0"\\])/g, (_, match: string) => {
		switch (match) {
			case "n":
				return "\n";
			case "r":
				return "\r";
			case "t":
				return "\t";
			case "b":
				return "\b";
			case "f":
				return "\f";
			case "v":
				return "\v";
			case "0":
				return "\0";
			case '"':
				return '"';
			case "\\":
				return "\\";
			default:
				return `\\${match}`;
		}
	});
}

/**
 * Find the index of an unescaped closing quote matching the delimiter.
 *
 * In double quotes (`"`), a backslash (`\`) escapes the following character.
 * In single quotes (`'`) and backticks (``` ` ```), backslashes are treated as literal characters.
 *
 * @param text Text to search
 * @param quote The quote character (`"`, `'`, or '`')
 * @returns The 0-based index of the matching closing quote, or -1 if not found
 */
function findClosingQuote(text: string, quote: string): number {
	for (let i = 0; i < text.length; i++) {
		if (quote === '"' && text[i] === "\\") {
			i++; // skip next character (escaped in double quotes)
			continue;
		}
		if (text[i] === quote) {
			return i;
		}
	}
	return -1;
}

/**
 * Parse plain `.env` file content into key-value pairs.
 *
 * Conforms to standard dotenv syntax:
 * - Ignores empty lines and `#` comments
 * - Supports optional `export ` prefix
 * - Supports single (`'`), double (`"`), and backtick (``` ` ```) quotes
 * - Supports multiline quoted values
 * - Strips inline comments on unquoted values (`KEY=val # comment`)
 * - Does not perform variable expansion (literal values)
 *
 * @param content The `.env` file content string
 * @returns A dictionary of parsed environment variables
 */
export function parseDotenv(content: string): Record<string, string> {
	const result: Record<string, string> = {};
	const lines = content.split(/\r?\n/);

	let currentKey: string | null = null;
	let currentValue = "";
	let inQuoteChar: string | null = null;

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];

		if (inQuoteChar !== null) {
			const closingIdx = findClosingQuote(rawLine, inQuoteChar);
			if (closingIdx !== -1) {
				currentValue += "\n" + rawLine.slice(0, closingIdx);
				const finalVal =
					inQuoteChar === '"'
						? unescapeDoubleQuoted(currentValue)
						: currentValue;
				if (currentKey !== null) {
					result[currentKey] = finalVal;
				}
				currentKey = null;
				currentValue = "";
				inQuoteChar = null;
			} else {
				currentValue += "\n" + rawLine;
			}
			continue;
		}

		let line = rawLine.trimStart();
		if (!line || line.startsWith("#")) {
			continue;
		}

		if (line.startsWith("export ")) {
			line = line.slice(7).trimStart();
		}

		const eqIdx = line.indexOf("=");
		if (eqIdx === -1) {
			continue;
		}

		const key = line.slice(0, eqIdx).trim();
		if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
			continue;
		}

		let val = line.slice(eqIdx + 1).trimStart();

		const firstChar = val[0];
		if (firstChar === '"' || firstChar === "'" || firstChar === "`") {
			const afterFirst = val.slice(1);
			const closingIdx = findClosingQuote(afterFirst, firstChar);
			if (closingIdx !== -1) {
				const inner = afterFirst.slice(0, closingIdx);
				result[key] = firstChar === '"' ? unescapeDoubleQuoted(inner) : inner;
			} else {
				currentKey = key;
				currentValue = afterFirst;
				inQuoteChar = firstChar;
			}
		} else {
			// Unquoted: strip trailing inline comments
			const commentIdx = val.indexOf(" #");
			if (commentIdx !== -1) {
				val = val.slice(0, commentIdx);
			}
			result[key] = val.trimEnd();
		}
	}

	return result;
}
