import pc from "picocolors";

/**
 * Formats a string as a code section (cyan with backticks).
 */
export const code = (str: string) => pc.cyan(`\`${str}\``);
