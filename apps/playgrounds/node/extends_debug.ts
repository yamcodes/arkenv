import { type } from "arktype";

const n = type("number >= 10").internal;
const num = type.number.internal;

console.log("n.extends(num):", n.extends(num));
console.log("n.kind:", n.kind);
console.log("num.kind:", num.kind);
