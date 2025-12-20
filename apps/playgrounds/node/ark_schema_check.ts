import { type BaseRoot, type NodeKind } from "@ark/schema";
import { type } from "arktype";

const n: BaseRoot = (type.number as any).internal;
console.log("n.kind:", n.kind);
