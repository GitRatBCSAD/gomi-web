import type { JSX } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RISK_BANDS, type RiskBand } from "@/lib/interpret";
import { cn } from "@/lib/utils";

import { P } from "./typography";

/**
 * Verbal risk band badge. The raw score lives in the tooltip so the label is
 * read first and the number second.
 */
export function RiskLabel({
	band,
	score,
	size = "sm",
	className,
}: {
	band: RiskBand;
	score?: number | null;
	size?: "xs" | "sm" | "md";
	className?: string;
}): JSX.Element {
	const info = RISK_BANDS[band];
	const text = band === "insufficient" ? info.label : `${info.label} risk`;
	return (
		<Tooltip>
			<TooltipTrigger
				className={cn(
					"inline-flex shrink-0 cursor-help items-center rounded font-semibold whitespace-nowrap",
					size === "xs"
						? "px-1.5 py-0.5 text-[11px]"
						: size === "md"
							? "px-3 py-1.5 text-sm"
							: "px-2.5 py-1 text-xs",
					className,
				)}
				style={{ backgroundColor: info.bg, color: info.fg }}
			>
				{text}
			</TooltipTrigger>
			<TooltipContent className="bg-muted flex max-w-[16rem] flex-col items-start gap-1 border p-3 text-left">
				<P className="font-semibold">{text}</P>
				<P className="text-muted-foreground">{info.meaning}</P>
				{score != null && band !== "insufficient" && (
					<P className="text-muted-foreground text-xs">
						Model score: {score.toFixed(2)}. Compare files by it; it is not a calibrated
						chance of a bug.
					</P>
				)}
			</TooltipContent>
		</Tooltip>
	);
}
