import { describe, expect, it } from "vitest";
import arkenv, { type } from "../src/index";

describe("default values with arrays", () => {
  it("should fail with current implementation - array default", () => {
    // This should fail with current type constraints
    expect(() => {
      const env = arkenv({
        // @ts-expect-error - This should not work with current types
        ARRAY: type("number[]").default(() => []),
      });
    }).toThrow();
  });

  it("should work with string-based default arrays", () => {
    // This should work
    const env = arkenv({
      ARRAY: "number[] = []",
    }, {});
    
    expect(env.ARRAY).toEqual([]);
  });

  it("should work with the type function directly", () => {
    // This should work as mentioned in the issue
    const envType = type({
      ARRAY: type("number[]").default(() => []),
    });

    const result = envType.assert({});
    expect(result.ARRAY).toEqual([]);
  });
});