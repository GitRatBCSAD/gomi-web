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
	if (props.lowConf) {
		return (
			<div
				className="h-2 w-full rounded-full"
				style={{ backgroundColor: "var(--background-700)" }}
			/>
		);
	}

	const total = props.risky + props.caution + props.ok;
	const empty = total === 0;

	return (
		<div className="flex h-2 w-full overflow-hidden rounded-full">
			<div
				style={{
					flex: empty ? 1 : props.risky,
					minWidth: props.risky > 0 ? 2 : 0,
					backgroundColor: empty ? "var(--background-700)" : "var(--destructive-500)",
				}}
			/>
			<div
				style={{
					flex: empty ? 0 : props.caution,
					minWidth: props.caution > 0 ? 2 : 0,
					backgroundColor: "var(--caution-500)",
				}}
			/>
			<div
				style={{
					flex: empty ? 0 : props.ok,
					minWidth: props.ok > 0 ? 2 : 0,
					backgroundColor: "var(--primary-500)",
				}}
			/>
		</div>
	);
}

export function Tile(props: {
	node: HierarchyRectangularNode<TreeNode>;
	onNavigate: (path: string) => void;
}): JSX.Element {
	const w = props.node.x1 - props.node.x0;
	const h = props.node.y1 - props.node.y0;
	const risk = props.node.data.risk ?? 0;
	const complexity = props.node.data.complexity ?? 0;
	const commits = props.node.data.commits ?? 0;
	const lowConf = props.node.data.lowConf ?? false;
	const name = props.node.data.name ?? "";
	const dir = props.node.data.dir ?? "";
	const info = RISK_BANDS[props.node.data.band ?? "insufficient"];
	const bandText = lowConf ? info.label : `${info.label} risk`;
	const tooSmall = w < 52 || h < 34;

	return (
		<Tooltip>
			<TooltipTrigger
				className="border-dark-500 absolute cursor-pointer overflow-hidden border text-left hover:outline focus-visible:outline"
				style={{
					left: props.node.x0,
					top: props.node.y0,
					width: w,
					height: h,
					backgroundColor: lowConf ? "var(--background-700)" : info.fg,
				}}
				onClick={() => props.onNavigate(`${dir}${name}`)}
			>
				{!tooSmall && (
					<div className="pointer-events-none absolute right-1.5 bottom-1.5 left-1.5">
						<P
							className={cn(
								"truncate text-xs leading-tight",
								lowConf ? "text-white/90" : "text-black",
							)}
						>
							{name}
						</P>
						{lowConf ? (
							<P className="text-xs text-white/50">No score</P>
						) : (
							<P className="text-xs text-black/70">{bandText}</P>
						)}
					</div>
				)}
			</TooltipTrigger>

			<TooltipContent
				side="bottom"
				align="center"
				className="bg-muted flex max-w-fit flex-col border"
			>
				<div>
					<P>{name}</P>
					<P className="text-muted-foreground text-sm">{dir}</P>
				</div>

				<div className="flex w-full items-center justify-between gap-4">
					<span
						className="font-fira-mono rounded px-1.5 py-0.5 text-xs font-bold"
						style={{ backgroundColor: info.bg, color: info.fg }}
					>
						{bandText}
					</span>
					{!lowConf && (
						<P className="text-muted-foreground text-xs">
							Score {risk.toFixed(2)}
						</P>
					)}
				</div>
				<P className="text-muted-foreground max-w-[16rem] text-sm">{info.meaning}</P>

				<div className="font-fira-mono space-y-1 text-sm">
					<div className="flex justify-between gap-4">
						<P>Complexity</P>
						<P>{percentileLabel(complexity)} in repo</P>
					</div>

					<div className="flex justify-between gap-4">
						<P>Changes (6 months)</P>
						<P>{commits}</P>
					</div>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
