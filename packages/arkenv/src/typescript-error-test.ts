import arkenv, { type } from "../src/index";

// This should demonstrate the TypeScript error mentioned in the issue
const Thing = arkenv({
  array: type("number.integer[]").default(() => []),
});