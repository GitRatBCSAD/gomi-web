import { useState, type JSX } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceLine,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { GlossaryHint } from "@/components/glossary-hint";
import { H1, P } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { FileRiskResult } from "@/lib/github/model";

type SentimentCode = "caution" | "neutral" | "satisfaction";

const SENTIMENT_COLOR: Record<SentimentCode, string> = {
	caution: "var(--destructive-500)",
	neutral: "var(--muted-foreground)",
	satisfaction: "var(--success-500)",
};

type ChartPoint = {
	index: number;
	prob: number;
	hash: string;
	message: string;
	date: string;
	sentimentCode: SentimentCode;
};

function TooltipContent({
	active,
	payload,
}: {
	active?: boolean;
	payload?: ReadonlyArray<{ payload: ChartPoint }>;
}): JSX.Element | null {
	if (!active || !payload?.length) return null;
	const d = payload[0].payload;
	const color = SENTIMENT_COLOR[d.sentimentCode];
	return (
		<div
			className="border-border/60 bg-background rounded-lg border p-2.5 shadow-xl"
			style={{ maxWidth: "18rem" }}
		>
			<P className="truncate text-sm font-bold">"{d.message}"</P>
			<div className="font-fira-mono text-muted-foreground mt-1 flex items-center justify-between gap-4 text-xs">
				<span>{d.hash}</span>
				<span className="font-bold" style={{ color }}>
					{d.sentimentCode}
				</span>
			</div>
		</div>
	);
}

export function SentimentTrajectoryCard({
	file,
	threshold,
	id,
}: {
	file: FileRiskResult;
	threshold: number;
	id?: string;
}): JSX.Element | null {
	const [activeIdx, setActiveIdx] = useState<number | null>(null);

	if (file.lowConfidence || file.commitSentiments.length < 10) {
		return null;
	}

	const commits = [...file.commitSentiments].sort((a, b) => a.committedAt - b.committedAt);
	if (commits.length === 0) return null;

	const data: ChartPoint[] = commits
		.filter((c) => c.riskProbability != null)
		.map((c, idx) => {
			const prob = c.riskProbability as number;
			const date = new Date(c.committedAt * 1000).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});
			const sentimentCode: SentimentCode =
				c.sentiment?.code === "caution" || c.sentiment?.code === "satisfaction"
					? c.sentiment.code
					: "neutral";
			return { index: idx, prob, hash: c.hash.slice(0, 7), message: c.message, date, sentimentCode };
		});

	if (data.length < 10) return null;

	const dotRenderer = (props: {
		cx?: number;
		cy?: number;
		index?: number;
		payload?: ChartPoint;
	}): JSX.Element => {
		const { cx = 0, cy = 0, index = 0, payload } = props;
		const sentimentCode = payload?.sentimentCode ?? "neutral";
		const isActive = activeIdx === index;
		return (
			<circle
				key={index}
				cx={cx}
				cy={cy}
				r={isActive ? 6 : 4}
				fill={SENTIMENT_COLOR[sentimentCode]}
				stroke="var(--background)"
				strokeWidth={2}
				style={{ cursor: "pointer", transition: "r 0.1s" }}
			/>
		);
	};

	return (
		<Card id={id}>
			<CardHeader>
				<H1 variant="h4">
					Sentiment Trajectory
					<GlossaryHint term="sentiment-trajectory" />
				</H1>
				<P className="text-muted-foreground">
					Per-commit caution probability over the 6-month analysis window
					<GlossaryHint term="caution-probability" />
				</P>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={{
						prob: { label: "p(caution)", color: "var(--primary-500)" },
					}}
					className="h-[220px] w-full"
				>
					<LineChart
						data={data}
						margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
						onMouseMove={(s) => {
							const idx = s?.activeTooltipIndex;
							setActiveIdx(typeof idx === "number" ? idx : null);
						}}
						onMouseLeave={() => setActiveIdx(null)}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="var(--border)"
							strokeOpacity={0.3}
						/>
						<XAxis
							dataKey="index"
							type="number"
							domain={[0, data.length - 1]}
							tickFormatter={(idx: number) => data[idx]?.date ?? ""}
							tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontFamily: "var(--font-fira-mono)" }}
							interval="preserveStartEnd"
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							domain={[0, 1]}
							ticks={[0, 0.25, 0.5, 0.75, 1.0]}
							tick={{ fontSize: 9, fill: "var(--muted-foreground)", fontFamily: "var(--font-fira-mono)" }}
							tickLine={false}
							axisLine={false}
							width={32}
						/>
						<Tooltip
							content={(props) => (
								<TooltipContent
									active={props.active}
									payload={props.payload as ReadonlyArray<{ payload: ChartPoint }>}
								/>
							)}
							cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
						/>
						<ReferenceLine
							y={threshold}
							stroke="#eab308"
							strokeDasharray="4 4"
							strokeWidth={1.5}
							label={{
								value: `MODEL THRESHOLD ${threshold.toFixed(2)}`,
								position: "insideTopRight",
								fontSize: 9,
								fill: "#eab308",
								fontFamily: "var(--font-fira-mono)",
								fontWeight: "bold",
							}}
						/>
						<Line
							type="monotone"
							dataKey="prob"
							stroke="var(--muted-foreground)"
							strokeOpacity={0.5}
							strokeWidth={2}
							dot={dotRenderer}
							activeDot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
