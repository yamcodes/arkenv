import { type, Type } from "arktype";
import { parsedNumber } from "../../../packages/internal/keywords/src/index.ts";

const numNode = type("number >= 10").internal;
const parsedNumInternal = (parsedNumber as any).internal;

const piped = parsedNumInternal.pipe(numNode);
const pipedType = new Type(piped, type.$);

console.log("piped.expression:", piped.expression);
console.log("pipedType('20'):", pipedType("20"));
