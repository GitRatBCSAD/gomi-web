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

/** p-value as a plain percentage chance, e.g. 0.005 -> "0.5%". */
const fmtChance = (p: number) =>
	p < 0.001 ? "Under 0.1%" : `${(p * 100).toFixed(p < 0.01 ? 1 : 0)}%`;

type SentimentCode = "caution" | "neutral" | "satisfaction";

const SENTIMENT_COLOR: Record<SentimentCode, string> = {
	caution: "var(--destructive-500)",
	neutral: "var(--muted-foreground)",
	satisfaction: "var(--success-500)",
};

const TREND_COLOR: Record<Trend, string> = {
	up: "var(--destructive-500)",
	down: "var(--success-500)",
	steady: "var(--foreground)",
};

// Dot colour follows the chart, not the argmax label: red only above the caution line,
// so the caption "dots above the line read as cautious" always matches what is drawn.
function dotCode(prob: number, argmax: string | undefined): SentimentCode {
	if (prob >= CAUTION_THRESHOLD) return "caution";
	return argmax === "satisfaction" ? "satisfaction" : "neutral";
}

type ChartPoint = {
	index: number;
	at: number;
	prob: number;
	hash: string;
	message: string;
	date: string;
	author: string | null;
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
			<div className="text-muted-foreground mt-1 flex flex-col gap-1 text-xs">
				<span className="truncate">
					{d.author ? `${d.author} - ` : ""}
					{d.date}
				</span>
				<span className="font-bold" style={{ color }}>
					{toneLabel(d.sentimentCode)}
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
			How cautious commit messages sounded over time
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
			at: c.committedAt,
			prob,
			hash: c.hash.slice(0, 7),
			message: c.message,
			date: fmtDate(c.committedAt),
			author: c.author ?? null,
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
				{/* Compact key instead of a caption sentence: same information, less text. */}
				<div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
					{(["caution", "neutral", "satisfaction"] as const).map((code) => (
						<span key={code} className="flex items-center gap-1.5">
							<span
								className="size-2 rounded-full"
								style={{ backgroundColor: SENTIMENT_COLOR[code] }}
							/>
							{toneLabel(code)}
						</span>
					))}
					<span className="flex items-center gap-1.5">
						<span
							className="w-4 border-t border-dashed"
							style={{ borderColor: "var(--risk-high-ink)" }}
						/>
						Caution line
					</span>
					{/* <span>One dot per change</span> */}
					{/* <GlossaryHint term="caution-probability" /> */}
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={{
						prob: { label: "Caution level", color: "var(--primary-500)" },
					}}
					className="h-[236px] w-full"
				>
					<LineChart
						data={data}
						margin={{ top: 32, right: 44, bottom: 8, left: 0 }}
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
							dataKey="at"
							type="number"
							scale="time"
							domain={["dataMin", "dataMax"]}
							tickFormatter={(t: number) => fmtDate(t)}
							tickCount={5}
							tickMargin={10}
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
								v === 0 ? "Calm" : v === 1 ? "Cautious" : "Mixed"
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
								value: "Caution line",
								position: "insideTopRight",
								fontSize: 11,
								fill: "var(--risk-high-ink)",
								fontFamily: "var(--font-sans)",
								fontWeight: 600,
							}}
						/>
						{jumpIdx >= 0 && (
							<ReferenceDot
								x={data[jumpIdx].at}
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
					{/* One labelled row per number instead of a single run-on line. */}
					<dl className="text-muted-foreground mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs tabular-nums">
						{[
							[
								"Average caution level, older → newer half",
								`${trend.earlierAvg.toFixed(2)} → ${trend.laterAvg.toFixed(2)} (${trend.pctChange > 0 ? "+" : ""}${trend.pctChange}%)`,
							],
							[
								"Trend test (Mann–Kendall)",
								`${fmtChance(trend.pValue)} chance of a pattern this strong with no real trend (a trend needs under 5%)`,
							],
							["Caution line", `caution level of ${CAUTION_THRESHOLD} or higher`],
							["Readable commits", String(data.length)],
							...(drift ? [["Drift pattern", drift.category]] : []),
						].map(([k, v]) => (
							<div key={k} className="contents">
								<dt>{k}</dt>
								<dd className="text-foreground">{v}</dd>
							</div>
						))}
					</dl>
				</details>
			</CardContent>
		</Card>
	);
}
