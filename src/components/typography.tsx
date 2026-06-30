import type { ComponentProps } from "react";
import type { JSX } from "react/jsx-runtime";

import { cn } from "@/lib/utils";

export function H1(props: ComponentProps<"h1">): JSX.Element {
	return (
		<h1 className={cn("font-fira-mono-bold text-5xl", props.className)}>{props.children}</h1>
	);
}

export function P(props: ComponentProps<"p">): JSX.Element {
	return <p className={cn("font-fira-mono text-base", props.className)}>{props.children}</p>;
}
