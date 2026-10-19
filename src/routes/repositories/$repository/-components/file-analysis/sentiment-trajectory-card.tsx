import { useState, type JSX } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ReferenceArea,
	ReferenceDot,
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
import {
	CAUTION_THRESHOLD,
	fmtDate,
	MIN_TREND_POINTS,
	readableCommits,
	toneLabel,
	worryTrend,
	type Trend,
} from "@/lib/interpret";

import { computeDrift } from "./drift-utils";

type SentimentCode = "caution" | "neutral" | "satisfaction";

const SENTIMENT_COLOR: Record<SentimentCode, string> = {
	caution: "var(--destructive-500)",
	neutral: "var(--muted-foreground)",
	satisfaction: "var(--success-500)",
};

const TREND_COLOR: Record<Trend, string> = {
	up: "var(--destructive-500)",
	down: "var(--success-500)",
	steady: "var(--text-subtle)",
};

// Dot colour follows the chart, not the argmax label: red only above the worried line,
// so the caption "dots above the line read as worried" always matches what is drawn.
function dotCode(prob: number, argmax: string | undefined): SentimentCode {
	if (prob >= CAUTION_THRESHOLD) return "caution";
	return argmax === "satisfaction" ? "satisfaction" : "neutral";
}

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
			<div className="text-muted-foreground mt-1 flex items-center justify-between gap-4 text-xs">
				<span>{d.date}</span>
				<span className="font-bold" style={{ color }}>
					{toneLabel(d.sentimentCode)} tone
				</span>
			</div>
		</div>
	);
}

export function SentimentTrajectoryCard({
	file,
	id,
}: {
	file: FileRiskResult;
	id?: string;
}): JSX.Element | null {
	const [activeIdx, setActiveIdx] = useState<number | null>(null);

	const readable = readableCommits(file.commitSentiments);
	const title = (
		<P className="text-muted-foreground text-sm">
			How worried commit messages sounded over time
			<GlossaryHint term="sentiment-trajectory" />
		</P>
	);

	// Never hide silently: say why there is no trend.
	if (file.lowConfidence || readable.length < MIN_TREND_POINTS) {
		return (
			<Card id={id}>
				<CardHeader>
					{title}
					<H1 variant="h4">Not enough to show a trend yet</H1>
					<P className="text-muted-foreground">
						{readable.length === 0
							? "None of this file's commit messages are long enough to read."
							: `Only ${readable.length} of the ${MIN_TREND_POINTS} readable commit messages needed to draw a trend.`}{" "}
						Messages under 5 words are skipped.
					</P>
				</CardHeader>
			</Card>
		);
	}

	const trend = worryTrend(readable) as NonNullable<ReturnType<typeof worryTrend>>;
	const drift = computeDrift(readable, file.shapBreakdown);

	const data: ChartPoint[] = readable.map((c, idx) => {
		const prob = c.riskProbability as number;
		return {
			index: idx,
			prob,
			hash: c.hash.slice(0, 7),
			message: c.message,
			date: fmtDate(c.committedAt),
			sentimentCode: dotCode(prob, c.sentiment?.code),
		};
	});

	const jumpIdx = drift?.rootCauseCommit
		? readable.findIndex((c) => c.hash === drift.rootCauseCommit?.hash)
		: -1;
	const jumpLabel = drift?.spikeDirection === "down" ? "Biggest drop" : "Biggest jump";

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
				{title}
				<H1 variant="h4" style={{ color: TREND_COLOR[trend.trend] }}>
					{trend.headline}
				</H1>
				<P className="text-foreground">{trend.sentence}</P>
				<P className="text-muted-foreground text-sm">
					Each dot is one change, oldest on the left. Dots above the dashed line read as
					worried; green dots read as positive.
					<GlossaryHint term="caution-probability" />
				</P>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={{
						prob: { label: "Worry level", color: "var(--primary-500)" },
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
							tick={{
								fontSize: 11,
								fill: "var(--muted-foreground)",
								fontFamily: "var(--font-sans)",
							}}
							interval="preserveStartEnd"
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							domain={[0, 1]}
							ticks={[0, 0.5, 1.0]}
							tickFormatter={(v: number) =>
								v === 0 ? "Calm" : v === 1 ? "Worried" : "Mixed"
							}
							tick={{
								fontSize: 11,
								fill: "var(--muted-foreground)",
								fontFamily: "var(--font-sans)",
							}}
							tickLine={false}
							axisLine={false}
							width={56}
						/>
						<Tooltip
							content={(props) => (
								<TooltipContent
									active={props.active}
									payload={
										props.payload as ReadonlyArray<{ payload: ChartPoint }>
									}
								/>
							)}
							cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
						/>
						<ReferenceArea
							y1={CAUTION_THRESHOLD}
							y2={1}
							fill="var(--risk-very-high-fill)"
							fillOpacity={0.08}
							stroke="none"
						/>
						<ReferenceLine
							y={CAUTION_THRESHOLD}
							stroke="var(--risk-high-ink)"
							strokeDasharray="4 4"
							strokeWidth={1.5}
							label={{
								value: "Worried line",
								position: "insideTopRight",
								fontSize: 11,
								fill: "var(--risk-high-ink)",
								fontFamily: "var(--font-sans)",
								fontWeight: 600,
							}}
						/>
						{jumpIdx >= 0 && (
							<ReferenceDot
								x={jumpIdx}
								y={data[jumpIdx].prob}
								r={9}
								fill="none"
								stroke="var(--foreground)"
								strokeWidth={1.5}
								label={{
									value: jumpLabel,
									position: "top",
									fontSize: 11,
									fill: "var(--foreground)",
									fontFamily: "var(--font-sans)",
								}}
							/>
						)}
						<Line
							type="linear"
							dataKey="prob"
							stroke="var(--muted-foreground)"
							strokeOpacity={0.6}
							strokeWidth={1.5}
							dot={dotRenderer}
							activeDot={false}
							isAnimationActive={false}
						/>
					</LineChart>
				</ChartContainer>
				<details className="mt-3">
					<summary className="text-muted-foreground cursor-pointer text-xs">
						Show model numbers
					</summary>
					<P className="mt-2 text-xs" style={{ color: "var(--text-subtle)" }}>
						Average worry level (p(caution)) {trend.earlierAvg.toFixed(2)} →{" "}
						{trend.laterAvg.toFixed(2)} ({trend.pctChange > 0 ? "+" : ""}
						{trend.pctChange}%) · ±10% counts as a trend · worried line at{" "}
						{CAUTION_THRESHOLD} · {data.length} readable commits
						{drift ? ` · pattern: ${drift.category}` : ""}
					</P>
				</details>
			</CardContent>
		</Card>
	);
}
