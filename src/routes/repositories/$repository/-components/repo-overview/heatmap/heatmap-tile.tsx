import type { HierarchyRectangularNode } from "d3-hierarchy";
import type { JSX } from "react";

import { P } from "@/components/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RISK_BANDS, percentileLabel } from "@/lib/interpret";
import { cn } from "@/lib/utils";

import type { TreeNode } from "./heatmap-utils";

export function SentimentBar(props: {
	risky: number;
	caution: number;
	ok: number;
	lowConf: boolean;
}): JSX.Element {
	const total = props.risky + props.caution + props.ok;
	if (props.lowConf || total === 0) {
		return <div className="bg-muted h-1.5 w-full rounded-full" />;
	}

	return (
		<div className="bg-muted flex h-1.5 w-full gap-px overflow-hidden rounded-full">
			{[
				{ n: props.risky, color: "var(--risk-very-high-fill)" },
				{ n: props.caution, color: "var(--muted-foreground)" }, // same neutral gray as the tone card, not the Low band color
				{ n: props.ok, color: "var(--success-500)" },
			].map((s, i) =>
				s.n > 0 ? <div key={i} style={{ flex: s.n, backgroundColor: s.color }} /> : null,
			)}
		</div>
	);
}

export function Tile(props: {
	node: HierarchyRectangularNode<TreeNode>;
	onNavigate: (path: string) => void;
}): JSX.Element {
	const w = props.node.x1 - props.node.x0;
	const h = props.node.y1 - props.node.y0;
	const complexity = props.node.data.complexity ?? 0;
	const commits = props.node.data.commits ?? 0;
	const lowConf = props.node.data.lowConf ?? false;
	const name = props.node.data.name ?? "";
	const dir = props.node.data.dir ?? "";
	const info = RISK_BANDS[props.node.data.band ?? "insufficient"];
	const bandText = lowConf ? info.label : `${info.label} risk`;
	const tooSmall = w < 56 || h < 36;
	const narrow = w < 120;

	return (
		<Tooltip>
			<TooltipTrigger
				className={cn(
					"absolute cursor-pointer overflow-hidden rounded-[3px] text-left transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--foreground)",
					lowConf && "bg-hatch",
				)}
				style={{
					left: props.node.x0,
					top: props.node.y0,
					width: w,
					height: h,
					backgroundColor: lowConf ? undefined : info.fill,
					color: info.onFill,
				}}
				aria-label={`${dir}${name}: ${bandText}`}
				onClick={() => props.onNavigate(`${dir}${name}`)}
			>
				{!tooSmall && (
					<div className="pointer-events-none absolute right-2 bottom-1.5 left-2">
						<P className="truncate text-xs leading-snug font-medium text-inherit">
							{name}
						</P>
						<P className="truncate text-[11px] leading-snug text-inherit opacity-80">
							{lowConf ? "No score" : narrow ? info.label : bandText}
						</P>
					</div>
				)}
			</TooltipTrigger>

			<TooltipContent
				side="bottom"
				align="center"
				className="bg-popover text-popover-foreground flex max-w-[18rem] flex-col items-start gap-2 border p-3"
			>
				<div className="min-w-0">
					<P className="truncate text-sm font-semibold">{name}</P>
					{dir && (
						<P className="text-muted-foreground truncate font-mono text-xs">{dir}</P>
					)}
				</div>
				<span
					className="rounded px-1.5 py-0.5 text-xs font-semibold"
					style={{ backgroundColor: info.bg, color: info.fg }}
				>
					{bandText}
				</span>
				<P className="text-muted-foreground text-sm">{info.meaning}</P>
				<dl className="grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs">
					<dt className="text-muted-foreground">Complexity</dt>
					<dd className="text-right">{percentileLabel(complexity)} in repo</dd>
					<dt className="text-muted-foreground">Changes in 6 months</dt>
					<dd className="text-right font-mono tabular-nums">{commits}</dd>
				</dl>
			</TooltipContent>
		</Tooltip>
	);
}
