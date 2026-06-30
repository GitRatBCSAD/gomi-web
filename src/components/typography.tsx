import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import type { JSX } from "react/jsx-runtime";

import { cn } from "@/lib/utils";

const typography = cva("", {
	variants: {
		variant: {
			h1: "font-fira-mono-bold text-5xl",
			h2: "font-fira-mono-bold text-4xl",
			p: "font-fira-mono text-base",
		},
	},
});

type TypographyProps = VariantProps<typeof typography>;

export function H1({
	variant = "h1",
	className,
	...props
}: ComponentProps<"h1"> & TypographyProps): JSX.Element {
	return <h1 className={cn(typography({ variant }), className)} {...props} />;
}

export function H2({
	variant = "h2",
	className,
	...props
}: ComponentProps<"h2"> & TypographyProps): JSX.Element {
	return <h2 className={cn(typography({ variant }), className)} {...props} />;
}

export function P({
	variant = "p",
	className,
	...props
}: ComponentProps<"p"> & TypographyProps): JSX.Element {
	return <p className={cn(typography({ variant }), className)} {...props} />;
}
