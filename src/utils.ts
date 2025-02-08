/**
 * Indent a string by a given amount
 * @param str - The string to indent
 * @param amt - The amount to indent by, defaults to 2
 * @param options - Options
 * @param options.dontDetectNewlines - Whether to detect newlines and indent each line individually, defaults to false (indenting the whole string)
 * @returns The indented string
 */
export const indent = (
	str: string,
	amt = 2,
	{
		dontDetectNewlines = false,
	}: {
		dontDetectNewlines?: boolean;
	} = {},
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
