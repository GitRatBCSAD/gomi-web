import { useState, type JSX } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

export function SentimentTrajectoryCard({
	file,
	threshold,
}: {
	file: FileRiskResult;
	threshold: number;
}): JSX.Element | null {
	const [activeHoverIdx, setActiveHoverIdx] = useState<number | null>(null);

	if (file.lowConfidence || file.commitSentiments.length < 10) {
		return null;
	}

	const commits = [...file.commitSentiments].sort((a, b) => a.committedAt - b.committedAt);
	if (commits.length === 0) return null;

	const width = 640;
	const height = 220;
	const padding = { top: 25, right: 145, bottom: 45, left: 45 };
	const chartW = width - padding.left - padding.right;
	const chartH = height - padding.top - padding.bottom;

	const points = commits.map((c, idx) => {
		const prob =
			c.riskProbability ??
			(c.sentiment?.code === "caution" ? 0.8 : c.sentiment?.code === "satisfaction" ? 0.1 : 0.5);
		const x = padding.left + (idx / Math.max(commits.length - 1, 1)) * chartW;
		const y = padding.top + (1 - Math.min(Math.max(prob, 0), 1)) * chartH;
		return { x, y, prob, commit: c };
	});

	const pathD = points.reduce(
		(acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
		"",
	);

	const thresholdY = padding.top + (1 - Math.min(Math.max(threshold, 0), 1)) * chartH;

	const timeLabels = [
		{ label: "6mo ago", x: padding.left },
		{ label: "5mo", x: padding.left + chartW * 0.16 },
		{ label: "4mo", x: padding.left + chartW * 0.33 },
		{ label: "3mo", x: padding.left + chartW * 0.5 },
		{ label: "2mo", x: padding.left + chartW * 0.66 },
		{ label: "1mo", x: padding.left + chartW * 0.83 },
		{ label: "now", x: padding.left + chartW },
	];

	const activePoint = activeHoverIdx !== null ? points[activeHoverIdx] : null;

	return (
		<Card>
			<CardHeader>
				<p className="font-fira-mono-bold text-foreground text-xl">Sentiment Trajectory</p>
				<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
					Per-commit caution probability over the 6-month analysis window
				</p>
			</CardHeader>
			<CardContent className="overflow-x-auto">
				<div className="relative min-w-[500px]">
					<svg
						viewBox={`0 0 ${width} ${height}`}
						className="font-fira-mono h-auto w-full overflow-visible text-[10px]"
					>
						{[1.0, 0.75, 0.5, 0.25, 0.0].map((val) => {
							const y = padding.top + (1 - val) * chartH;
							return (
								<g key={val}>
									<line
										x1={padding.left}
										y1={y}
										x2={padding.left + chartW}
										y2={y}
										stroke="var(--border)"
										strokeOpacity={0.3}
										strokeDasharray="2 2"
									/>
									<text
										x={padding.left - 8}
										y={y + 3}
										textAnchor="end"
										fill="var(--text-subtle)"
									>
										{val.toFixed(2)}
									</text>
								</g>
							);
						})}

						{timeLabels.map(({ label, x }) => (
							<text
								key={label}
								x={x}
								y={height - 12}
								textAnchor="middle"
								fill="var(--text-subtle)"
								className="text-[9px]"
							>
								{label}
							</text>
						))}

						<line
							x1={padding.left}
							y1={thresholdY}
							x2={padding.left + chartW}
							y2={thresholdY}
							stroke="#eab308"
							strokeWidth={1.5}
							strokeDasharray="4 4"
						/>
						<text
							x={padding.left + chartW + 8}
							y={thresholdY + 3}
							fill="#eab308"
							fontWeight="bold"
							className="text-[9px] tracking-wider uppercase"
						>
							MODEL THRESHOLD {threshold.toFixed(2)}
						</text>

						<path
							d={pathD}
							fill="none"
							stroke="#22c55e"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>

						{points.map((pt, idx) => {
							const isHovered = activeHoverIdx === idx;
							const isAboveThreshold = pt.prob >= threshold;
							return (
								<g key={pt.commit.hash || idx}>
									<circle
										cx={pt.x}
										cy={pt.y}
										r={isHovered ? 6 : 4}
										fill={isAboveThreshold ? "#ef4444" : "#22c55e"}
										stroke="#0d1414"
										strokeWidth={2}
										className="cursor-pointer transition-all hover:scale-125"
										onMouseEnter={() => setActiveHoverIdx(idx)}
										onMouseLeave={() => setActiveHoverIdx(null)}
									/>
								</g>
							);
						})}
					</svg>

					{activePoint && (
						<div
							className="bg-background-900 border-border/60 pointer-events-none absolute z-20 max-w-xs -translate-x-1/2 -translate-y-full rounded-lg border p-2.5 shadow-xl"
							style={{
								left: `${(activePoint.x / width) * 100}%`,
								top: `${(activePoint.y / height) * 100 - 8}%`,
							}}
						>
							<p className="font-fira-mono text-foreground truncate text-xs font-bold">
								"{activePoint.commit.message}"
							</p>
							<div className="font-fira-mono text-muted-foreground mt-1 flex items-center justify-between gap-4 text-[10px]">
								<span>{activePoint.commit.hash.slice(0, 7)}</span>
								<span
									className="font-bold"
									style={{
										color:
											activePoint.prob >= threshold
												? "var(--destructive-500)"
												: "var(--primary-500)",
									}}
								>
									p(caution): {activePoint.prob.toFixed(2)}
								</span>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
