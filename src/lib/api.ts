import * as v from "valibot";

export type ApiResponse<T = null> = { message: string; data: T };

export function ApiResponseSchema(): v.ObjectSchema<
	{ message: v.StringSchema<undefined>; data: v.NullSchema<undefined> },
	undefined
>;

export function ApiResponseSchema<T extends v.GenericSchema>(
	dataSchema: T,
): v.ObjectSchema<{ message: v.StringSchema<undefined>; data: T }, undefined>;

export function ApiResponseSchema<T extends v.GenericSchema>(dataSchema?: T) {
	return v.object({
		message: v.string(),
		data: dataSchema ?? v.null(),
	});
}
