import { $ } from "./packages/internal/scope/src/index";
import type { type as at, distill } from "arktype";

type T = { DATABASE_HOST: "string.host" };
type Inferred = at.infer<T, $>;
type Out = distill.Out<Inferred>;

// @ts-ignore
const x: Out = { DATABASE_HOST: "localhost" };
// Check the type of x.DATABASE_HOST in the IDE (or hover in your mind)
// It should be string.
