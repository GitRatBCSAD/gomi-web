import * as v from "valibot";

export type ApiResponse<T = null> = { message: string; data: T };

export function ApiResponseSchema<T extends v.GenericSchema>(dataSchema?: T) {
	return v.object({
		message: v.string(),
		data: dataSchema ?? v.null(),
	});
}
