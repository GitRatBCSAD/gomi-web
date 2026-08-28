import { useState, type JSX } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

const PAGE_SIZE = 5;

function SentimentBadge({ code }: { code: string | null }): JSX.Element {
	if (code === "caution") {
		return (
			<Badge
				className="gap-1 text-[10px]"
				style={{
					backgroundColor: "var(--destructive-900)",
					color: "var(--destructive-500)",
					borderColor: "transparent",
				}}
			>
				Caution
			</Badge>
		);
	}
	if (code === "satisfaction") {
		return (
			<Badge
				className="gap-1 text-[10px]"
				style={{
					backgroundColor: "var(--success-900)",
					color: "var(--success-500)",
					borderColor: "transparent",
				}}
			>
				Satisfaction
			</Badge>
		);
	}
	return (
		<Badge
			className="gap-1 text-[10px]"
			style={{
				backgroundColor: "var(--dark-500)",
				color: "var(--text-subtle)",
				borderColor: "transparent",
			}}
		>
			Neutral
		</Badge>
	);
}

export function CommitSentimentCard({
	file,
	id,
}: {
	file: FileRiskResult;
	id?: string;
}): JSX.Element | null {
	const [page, setPage] = useState(1);

	if (file.lowConfidence || file.commitSentiments.length < 10) {
		return null;
	}

	const commits = [...file.commitSentiments].sort((a, b) => b.committedAt - a.committedAt);
	if (commits.length === 0) return null;

	const total = commits.length;
	let cautionCount = 0;
	let neutralCount = 0;
	let satisfactionCount = 0;

	for (const c of commits) {
		const code = c.sentiment?.code ?? null;
		if (code === "caution") cautionCount++;
		else if (code === "satisfaction") satisfactionCount++;
		else neutralCount++;
	}

	const cautionPct = Math.round((cautionCount / total) * 100);
	const neutralPct = Math.round((neutralCount / total) * 100);
	const satisfactionPct = Math.round((satisfactionCount / total) * 100);

	const totalPages = Math.ceil(commits.length / PAGE_SIZE);
	const startIndex = (page - 1) * PAGE_SIZE;
	const pageCommits = commits.slice(startIndex, startIndex + PAGE_SIZE);

	return (
		<Card id={id}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<p className="font-fira-mono-bold text-foreground text-xl">Commit sentiment</p>
						<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
							{total} COMMITS ANALYZED BY DISTILBERT · 6-MONTH WINDOW
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-3 gap-3">
					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<p className="font-fira-mono-bold text-xs" style={{ color: "var(--destructive-500)" }}>
							Caution
						</p>
						<div className="mt-1 flex items-baseline justify-between">
							<p className="font-fira-mono-bold text-2xl" style={{ color: "var(--destructive-500)" }}>
								{cautionPct}%
							</p>
							<p className="font-fira-mono text-muted-foreground/70 text-[10px] uppercase">
								{cautionCount} OF {total} COMMITS
							</p>
						</div>
					</div>

					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<p className="font-fira-mono-bold text-xs" style={{ color: "var(--text-subtle)" }}>
							Neutral
						</p>
						<div className="mt-1 flex items-baseline justify-between">
							<p className="font-fira-mono-bold text-2xl" style={{ color: "var(--text-subtle)" }}>
								{neutralPct}%
							</p>
							<p className="font-fira-mono text-muted-foreground/70 text-[10px] uppercase">
								{neutralCount} OF {total} COMMITS
							</p>
						</div>
					</div>

					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							padding: "1rem",
							backgroundColor: "var(--background-800)",
						}}
					>
						<p className="font-fira-mono-bold text-xs" style={{ color: "var(--success-500)" }}>
							Satisfaction
						</p>
						<div className="mt-1 flex items-baseline justify-between">
							<p className="font-fira-mono-bold text-2xl" style={{ color: "var(--success-500)" }}>
								{satisfactionPct}%
							</p>
							<p className="font-fira-mono text-muted-foreground/70 text-[10px] uppercase">
								{satisfactionCount} OF {total} COMMITS
							</p>
						</div>
					</div>
				</div>
				<div className="space-y-2">
					{pageCommits.map((c) => {
						const date = new Date(c.committedAt * 1000).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						});

						return (
							<div
								key={c.hash}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									gap: "0.75rem",
									padding: "0.75rem 1rem",
									borderRadius: "0.5rem",
									border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
									backgroundColor: "var(--background-800)",
								}}
							>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
										}}
									>
										<span className="font-fira-mono text-muted-foreground text-xs font-bold">
											{c.hash.slice(0, 7)}
										</span>
										<span className="font-fira-mono text-muted-foreground/60 text-xs">
											{date}
										</span>
									</div>
									<p
										className="font-fira-mono text-foreground mt-1 text-xs leading-relaxed"
										style={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{c.message}
									</p>
								</div>
								<div style={{ flexShrink: 0 }}>
									{c.lowInfo ? (
										<Badge
											className="gap-1 text-[10px]"
											style={{
												backgroundColor: "var(--dark-500)",
												color: "var(--text-subtle)",
												borderColor: "transparent",
											}}
										>
											Low info
										</Badge>
									) : (
										<SentimentBadge code={c.sentiment?.code ?? null} />
									)}
								</div>
							</div>
						);
					})}
				</div>

				{totalPages > 1 && (
					<div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
						<span className="font-fira-mono text-muted-foreground text-xs tabular-nums">
							Page {page} of {totalPages}
						</span>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page === 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={page === totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
