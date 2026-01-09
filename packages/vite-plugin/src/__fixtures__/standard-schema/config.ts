export const Env = {
	VITE_ZOD_VAR: {
		"~standard": {
			version: 1,
			validate(value: any) {
				return typeof value === "string" && value.length >= 5
					? { value }
					: { issues: [{ message: "min length 5" }] };
			},
		},
	},
};
