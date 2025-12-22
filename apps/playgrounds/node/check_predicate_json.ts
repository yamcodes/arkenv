import { type } from "arktype";

const T = type("number").narrow((n) => n % 2 === 0);
console.log(JSON.stringify(T.in.json, null, 2));
