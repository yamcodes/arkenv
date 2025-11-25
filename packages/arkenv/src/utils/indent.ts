/**
 * Options for the `indent` function
 */
type IndentOptions = {
	/**
	 * Whether to detect newlines and indent each line individually, defaults to false (indenting the whole string)
	 */
	dontDetectNewlines?: boolean;
};

/**
 * Indent a string by a given amount
 * @param str - The string to indent
 * @param amt - The amount to indent by, defaults to 2
 * @param options - {@link IndentOptions}
 * @returns The indented string
 */
export const indent = (
	str: string,
	amt = 2,
	{ dontDetectNewlines = false }: IndentOptions = {},
) => {
	const detectNewlines = !dontDetectNewlines;
	if (detectNewlines) {
		return str
			.split("\n")
			.map((line) => `${" ".repeat(amt)}${line}`)
			.join("\n");
	}

	return `${" ".repeat(amt)}${str}`;
};
