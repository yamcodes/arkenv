/**
 * Status of a `.env.example` merge against the schema's declared keys.
 */
export type EnvExampleMergeStatus = "created" | "updated" | "unchanged";

/**
 * Result of merging declared schema keys into `.env.example` contents.
 */
export type EnvExampleMergeResult = {
	/**
	 * Serialized file contents (POSIX trailing newline when non-empty)
	 */
	content: string;
	/**
	 * Whether the file would be created, rewritten, or left as-is
	 */
	status: EnvExampleMergeStatus;
};

type ParsedBlock = {
	key: string;
	lines: string[];
};

const ASSIGNMENT_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;

/**
 * Return declared keys with first-occurrence order, dropping duplicates.
 *
 * @param keys Schema keys in declaration order
 * @returns Deduplicated key list
 */
export function uniqueDeclaredKeys(keys: string[]): string[] {
	const seen = new Set<string>();
	const unique: string[] = [];
	for (const key of keys) {
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);
		unique.push(key);
	}
	return unique;
}

/**
 * Detect whether a dotenv line assigns a variable.
 *
 * @param line A single dotenv line
 * @returns `true` when the line is a `KEY=` assignment
 */
function isAssignment(line: string): boolean {
	return ASSIGNMENT_RE.test(line);
}

/**
 * Extract the environment variable name from an assignment line.
 *
 * @param line A `KEY=` assignment line
 * @returns The key name, or undefined when the line is not an assignment
 */
function assignmentKey(line: string): string | undefined {
	return ASSIGNMENT_RE.exec(line)?.[1];
}

/**
 * Join lines with the detected newline sequence.
 *
 * @param lines File lines without newline characters
 * @param newline The newline sequence to use
 * @param trailingNewline Whether to end the file with a newline
 * @returns Serialized file contents
 */
function joinLines(
	lines: string[],
	newline: string,
	trailingNewline: boolean,
): string {
	if (lines.length === 0) {
		return trailingNewline ? newline : "";
	}
	const body = lines.join(newline);
	return trailingNewline ? `${body}${newline}` : body;
}

/**
 * Parse `.env.example` into a header, per-key blocks, and a footer.
 *
 * Comment and blank lines immediately above an assignment stay attached to
 * that key so they are removed with it and preserved when the key survives.
 *
 * @param content Existing file contents
 * @returns Header lines, key blocks, footer lines, and newline style
 */
function parseEnvExample(content: string): {
	header: string[];
	blocks: ParsedBlock[];
	footer: string[];
	newline: string;
	trailingNewline: boolean;
} {
	const newline = content.includes("\r\n") ? "\r\n" : "\n";
	const trailingNewline = content.endsWith("\n");
	const rawLines = content.split(/\r?\n/);
	if (trailingNewline && rawLines[rawLines.length - 1] === "") {
		rawLines.pop();
	}

	const header: string[] = [];
	const blocks: ParsedBlock[] = [];
	const footer: string[] = [];
	let i = 0;

	while (i < rawLines.length && !isAssignment(rawLines[i])) {
		header.push(rawLines[i]);
		i += 1;
	}

	while (i < rawLines.length) {
		const prelude: string[] = [];
		while (i < rawLines.length && !isAssignment(rawLines[i])) {
			prelude.push(rawLines[i]);
			i += 1;
		}
		if (i >= rawLines.length) {
			footer.push(...prelude);
			break;
		}
		const key = assignmentKey(rawLines[i]);
		if (!key) {
			prelude.push(rawLines[i]);
			i += 1;
			continue;
		}
		blocks.push({ key, lines: [...prelude, rawLines[i]] });
		i += 1;
	}

	return { header, blocks, footer, newline, trailingNewline };
}

/**
 * Merge declared schema keys into existing `.env.example` contents.
 *
 * Surviving keys keep their comments and values in file order. Keys missing
 * from the schema are dropped with their attached comments. New keys are
 * appended as `KEY=` in schema declaration order. A missing file is treated
 * as create-in-declaration-order.
 *
 * @param existing Current `.env.example` contents, or `null` when the file does not exist
 * @param declaredKeys Schema keys in declaration order
 * @returns Merged contents and create/update/unchanged status
 */
export function mergeEnvExample(
	existing: string | null,
	declaredKeys: string[],
): EnvExampleMergeResult {
	const keys = uniqueDeclaredKeys(declaredKeys);
	const keySet = new Set(keys);

	if (existing === null) {
		const content =
			keys.length === 0 ? "" : `${keys.map((key) => `${key}=`).join("\n")}\n`;
		return { content, status: "created" };
	}

	const parsed = parseEnvExample(existing);
	const kept = new Set<string>();
	const output: string[] = [...parsed.header];

	for (const block of parsed.blocks) {
		if (!keySet.has(block.key) || kept.has(block.key)) {
			continue;
		}
		output.push(...block.lines);
		kept.add(block.key);
	}

	for (const key of keys) {
		if (kept.has(key)) {
			continue;
		}
		output.push(`${key}=`);
		kept.add(key);
	}

	output.push(...parsed.footer);

	while (output.length > 0 && output[0] === "") {
		output.shift();
	}
	while (output.length > 0 && output[output.length - 1] === "") {
		output.pop();
	}

	const trailingNewline = keys.length > 0 || existing.endsWith("\n");
	const content = joinLines(
		output,
		parsed.newline,
		trailingNewline && output.length > 0,
	);

	if (content === existing) {
		return { content, status: "unchanged" };
	}

	return { content, status: "updated" };
}
