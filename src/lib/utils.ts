import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as v from "valibot";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function enumDetailSchema<T extends v.Enum>(code: T) {
	return v.object({
		id: v.number(),
		code: v.enum(code),
		label: v.string(),
	});
}
