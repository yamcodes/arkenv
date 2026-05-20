---
name: jsdoc
description: "Use this skill to automatically write or fix JSDoc comments for JavaScript/TypeScript code. It handles requests to document code at any scope: a single function, all functions in a file, or just the new and changed functions in a pull request."
---

# JSDoc Generation Skill

This skill guides the agent in adding or updating JSDoc comments for functions in TypeScript codebases.

## When to add JSDoc

- Add JSDoc to functions UNLESS the code is entirely self-explanatory or the function is named so clearly that a comment would be redundant.
- If in doubt, lean towards adding JSDoc if the function has complex logic or multiple parameters, but skip it for simple getters/setters or obvious utilities.
- For existing functions that already have JSDoc, ONLY update the JSDoc if there is a typo or if it no longer reflects the code's intent. Do NOT make redundant rephrasings or meaningless sentence shifts.

## JSDoc Requirements

When generating JSDoc comments, you MUST strictly adhere to the following rules:

1. **Follow JSDoc Specification**: Use standard block comment format (`/** ... */`).
2. **Document all inputs**: Use the `@param` tag for every parameter.
3. **Document the output**: Use the `@returns` tag for the return value (unless the function returns `void` and it's obvious).
4. **Document errors**: If the function explicitly throws an error (e.g., `throw new Error(...)`), document it using the `@throws` tag.
5. **NO Type Tags**: The codebase uses TypeScript, so do NOT include types in the JSDoc tags. For example, use `@param id The user ID` instead of `@param {string} id The user ID`.
6. **Imperative Verb Form**: The description MUST use the imperative verb form. For example, use "Create a user", "Add an item", "Calculate the total" instead of "Creates a user", "Adds an item", "Calculates the total".

## Example

**Input:**

```typescript
export function calculateDiscountedPrice(basePrice: number, discountPercentage: number, taxRate?: number): number {
    if (basePrice < 0) throw new Error("Price cannot be negative");
    // ...
}
```

**Output:**

```typescript
/**
 * Calculate the final price after applying a discount and optional tax.
 * 
 * @param basePrice The original price of the item
 * @param discountPercentage The discount to apply as a percentage (e.g., 20 for 20%)
 * @param taxRate The optional tax rate to apply after discount
 * @returns The final calculated price
 * @throws An error if the base price is negative
 */
export function calculateDiscountedPrice(basePrice: number, discountPercentage: number, taxRate?: number): number {
    if (basePrice < 0) throw new Error("Price cannot be negative");
    // ...
}
```

## Applying to Multiple Functions

- If the user asks to apply JSDoc to all functions in a file, process every function, but remember to skip those that are trivial and self-explanatory.
- If the user asks to apply JSDoc to all changed files in a PR, use the GitHub CLI (`gh pr diff` or similar) to identify which functions were added or modified, and only update those functions.
