import type { HierarchyRectangularNode } from "d3-hierarchy";
import { CircleAlertIcon, CircleCheckIcon, MinusCircleIcon, TriangleAlertIcon } from "lucide-react";
import type { JSX } from "react";

import { P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

import {
	legendGradient,
	riskColor,
	type FileInfo,
	type RiskCategory,
	type TreeNode,
} from "./heatmap-utils";

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

export function RiskBadge(props: { file: FileInfo; threshold: number }): JSX.Element {
	const { file, threshold } = props;

	if (file.lowConf) {
		return (
			<Badge
				className="gap-1"
				style={{
					backgroundColor: "var(--dark-500)",
					color: "var(--text-subtle)",
					borderColor: "transparent",
				}}
			>
				<MinusCircleIcon className="size-3" />
				Low Conf
			</Badge>
		);
	}

	if (file.risk >= threshold) {
		return (
			<Badge
				className="gap-1"
				style={{
					backgroundColor: "var(--destructive-900)",
					color: "var(--destructive-500)",
					borderColor: "transparent",
				}}
			>
				<TriangleAlertIcon className="size-3" />
				{file.risk.toFixed(2)}
			</Badge>
		);
	}

	if (file.risk >= 0.4) {
		return (
			<Badge
				className="gap-1"
				style={{
					backgroundColor: "var(--caution-900)",
					color: "var(--caution-500)",
					borderColor: "transparent",
				}}
			>
				<CircleAlertIcon className="size-3" />
				{file.risk.toFixed(2)}
			</Badge>
		);
	}

	return (
		<Badge
			className="gap-1"
			style={{
				backgroundColor: "var(--success-900)",
				color: "var(--success-500)",
				borderColor: "transparent",
			}}
		>
			<CircleCheckIcon className="size-3" />
			{file.risk.toFixed(2)}
		</Badge>
	);
}

export function Tile(props: {
	node: HierarchyRectangularNode<TreeNode>;
	threshold: number;
	onNavigate: (path: string) => void;
}): JSX.Element {
	const { theme } = useTheme();
	const w = props.node.x1 - props.node.x0;
	const h = props.node.y1 - props.node.y0;
	const risk = props.node.data.risk ?? 0;
	const complexity = props.node.data.complexity ?? 0;
	const commits = props.node.data.commits ?? 0;
	const lowConf = props.node.data.lowConf ?? false;
	const name = props.node.data.name ?? "";
	const dir = props.node.data.dir ?? "";
	const cat: RiskCategory = lowConf
		? "low-conf"
		: risk >= props.threshold
			? "risky"
			: "acceptable";
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
					backgroundColor: lowConf ? "var(--background-700)" : riskColor(risk, theme),
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
							<P className="text-xs tracking-wider text-white/50 uppercase">
								Low Conf
							</P>
						) : (
							<P className="text-black/70 text-xs">{risk.toFixed(2)}</P>
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

				<div className="flex w-full justify-between">
					<Badge>{cat === "low-conf" ? "Low Conf" : cat}</Badge>
					{!lowConf && <P>{risk.toFixed(2)}</P>}
				</div>

				<div className="font-fira-mono space-y-1 text-sm">
					<div className="flex justify-between gap-4">
						<P>complexity</P>
						<P>{complexity.toFixed(2)}</P>
					</div>

					<div className="flex justify-between gap-4">
						<P>commits</P>
						<P>{commits}</P>
					</div>
				</div>

				<div className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full">
					<div
						className="absolute inset-0"
						style={{
							background: legendGradient(theme),
							clipPath: `inset(0 ${(1 - risk) * 100}% 0 0 round 999px)`,
						}}
					/>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
