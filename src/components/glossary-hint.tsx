import { InfoIcon } from "lucide-react";
import type { JSX } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

import { P } from "./typography";

/**
 * Small info affordance placed next to a technical term. Hover or tap reveals a
 * plain-language definition and a "Learn more" link. Requires a TooltipProvider
 * ancestor (mounted globally in __root.tsx).
 */
export function GlossaryHint({
	term,
	side = "top",
}: {
	term: GlossaryKey;
	side?: "top" | "bottom" | "left" | "right";
}): JSX.Element {
	const { title, definition, reading, href } = GLOSSARY[term];
	return (
		<Tooltip>
			<TooltipTrigger
				aria-label={`What is ${title}?`}
				className="text-muted-foreground/40 hover:text-primary focus-visible:text-primary ml-1 inline-flex cursor-help align-middle transition-colors outline-none"
			>
				<InfoIcon className="size-3.5" />
			</TooltipTrigger>
			<TooltipContent
				side={side}
				className="bg-muted flex max-w-[16rem] flex-col items-start gap-1.5 border p-3 text-left"
			>
				<P className="font-semibold">{title}</P>
				<P className="text-muted-foreground"> {definition} </P>
				<P className="text-sm">
					<span className="font-semibold">How to read it: </span>
					{reading}
				</P>
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:text-primary/80 text-base transition-colors"
				>
					Learn more →
				</a>
			</TooltipContent>
		</Tooltip>
	);
}
