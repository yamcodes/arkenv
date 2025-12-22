import { type } from "arktype";

const schema = type("number.epoch");
console.log("JSON:", JSON.stringify(schema.in.json, null, 2));
