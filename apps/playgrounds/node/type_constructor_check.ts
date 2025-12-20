import { type, Type } from "arktype";

const n = type.number.internal;
const t = new Type(n, type.$);
console.log("t.expression:", t.expression);
console.log("t.allows(5):", t.allows(5));
console.log("t.allows('5'):", t.allows("5"));
