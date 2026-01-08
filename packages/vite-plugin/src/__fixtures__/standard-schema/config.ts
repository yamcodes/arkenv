import { z } from "zod";

export const Env = {
	VITE_ZOD_VAR: z.string().min(5),
};
