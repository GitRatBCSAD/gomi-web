import type { CSSProperties, JSX, ReactNode } from "react";
import { InfoIcon } from "lucide-react";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const underlineTriggerStyle: CSSProperties = {
	background: "none",
	border: "none",
	padding: 0,
	font: "inherit",
	color: "inherit",
	display: "inline",
	cursor: "help",
	borderBottom: "1px dashed currentColor",
	textDecorationSkipInk: "none",
};

const iconTriggerStyle: CSSProperties = {
	background: "none",
	border: "none",
	padding: 0,
	font: "inherit",
	color: "inherit",
	display: "inline-flex",
	alignItems: "center",
	cursor: "help",
};

/**
 * Wraps a term with an inline glossary tooltip.
 *
 * variant="underline" (default) — dashed underline on the text; use inside
 *   running sentences where the term flows with surrounding prose.
 *
 * variant="icon" — renders the children as-is followed by a small ⓘ icon;
 *   the icon is the tooltip trigger. Use for standalone metric labels where
 *   an underline would look noisy.
 */
export function GlossaryTerm({
	termKey,
	children,
	side = "top",
	variant = "underline",
}: {
	termKey: GlossaryKey;
	children: ReactNode;
	side?: "top" | "bottom" | "left" | "right";
	variant?: "underline" | "icon";
}): JSX.Element {
	const entry = GLOSSARY[termKey];

	const tooltipContent = (
		<TooltipContent
			side={side}
			className="flex max-w-[220px] flex-col items-start gap-1.5"
		>
			<span className="text-xs leading-relaxed">{entry.definition}</span>
			<a
				href={entry.learnMoreUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="text-[10px] underline opacity-70 hover:opacity-100"
				onClick={(e) => e.stopPropagation()}
			>
				Learn more ↗
			</a>
		</TooltipContent>
	);

	// ponytail: one TooltipProvider per term keeps this component self-contained
	if (variant === "icon") {
		return (
			<TooltipProvider closeDelay={300}>
				<Tooltip>
					<span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
						{children}
						<TooltipTrigger style={iconTriggerStyle}>
							<InfoIcon
								style={{
									width: "0.75rem",
									height: "0.75rem",
									opacity: 0.45,
									flexShrink: 0,
								}}
							/>
						</TooltipTrigger>
					</span>
					{tooltipContent}
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider closeDelay={300}>
			<Tooltip>
				<TooltipTrigger style={underlineTriggerStyle}>{children}</TooltipTrigger>
				{tooltipContent}
			</Tooltip>
		</TooltipProvider>
	);
}
