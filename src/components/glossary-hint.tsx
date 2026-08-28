import { InfoIcon } from "lucide-react";
import type { JSX } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

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
	const { title, definition, href } = GLOSSARY[term];
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
				<p className="font-fira-mono-bold text-foreground text-xs">{title}</p>
				<p className="font-fira-mono text-muted-foreground text-xs leading-relaxed normal-case">
					{definition}
				</p>
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:text-primary/80 font-fira-mono text-[11px] transition-colors"
				>
					Learn more →
				</a>
			</TooltipContent>
		</Tooltip>
	);
}
