import { useState, type JSX } from "react";

import { H1, H2, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";
import { cautionShareLabel, fmtDate, fmtPct, toneLabel } from "@/lib/interpret";

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
				Worried
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
				Positive
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

	if (file.lowConfidence) return null;

	const commits = [...file.commitSentiments].sort((a, b) => b.committedAt - a.committedAt);
	if (commits.length === 0) return null;

	const total = commits.length;
	const count = (code: string) => commits.filter((c) => c.sentiment?.code === code).length;
	const tooShort = commits.filter((c) => !c.sentiment).length;
	const labelled = total - tooShort;
	const groups = [
		{ code: "caution", color: "var(--destructive-500)" },
		{ code: "neutral", color: "var(--text-subtle)" },
		{ code: "satisfaction", color: "var(--success-500)" },
	].map((g) => ({ ...g, n: count(g.code) }));
	const cautionShare = labelled ? groups[0].n / labelled : 0;

	const totalPages = Math.ceil(commits.length / PAGE_SIZE);
	const startIndex = (page - 1) * PAGE_SIZE;
	const pageCommits = commits.slice(startIndex, startIndex + PAGE_SIZE);

	return (
		<Card id={id}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<H1 variant="h4">Tone of commit messages</H1>
						<P className="text-muted-foreground mt-1 text-sm">
							How developers described their {total} changes to this file in the last
							6 months
						</P>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<P className="text-foreground text-base">
					<span className="font-semibold">{cautionShareLabel(cautionShare)}.</span>{" "}
					{groups[0].n} of {labelled} readable messages sound worried or urgent.
					{tooShort > 0 && ` ${tooShort} were too short to read.`}
				</P>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{groups.map((g) => (
						<div
							key={g.code}
							className="rounded-lg border p-4"
							style={{ backgroundColor: "var(--background-800)" }}
						>
							<H2 variant="h4" className="text-sm" style={{ color: g.color }}>
								{toneLabel(g.code)} tone
							</H2>
							<div className="mt-1 flex items-baseline justify-between">
								<H2 variant="h4" style={{ color: g.color }}>
									{labelled ? fmtPct(g.n / labelled) : "—"}
								</H2>
								<P className="text-muted-foreground text-sm">
									{g.n} of {labelled} messages
								</P>
							</div>
						</div>
					))}
				</div>
				<div className="space-y-2">
					{pageCommits.map((c) => {
						const date = fmtDate(c.committedAt);

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
										<span className="text-muted-foreground text-sm">
											{date}
											{c.author ? ` · ${c.author}` : ""}
										</span>
										<span
											className="text-xs"
											style={{ color: "var(--text-subtle)" }}
											title="Commit ID"
										>
											{c.hash.slice(0, 7)}
										</span>
									</div>
									<P
										className="text-foreground mt-1 text-sm leading-relaxed"
										style={{
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{c.message}
									</P>
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
											Too short to read
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
					<div className="border-border/40 mt-4 flex items-center justify-between border-t pt-3">
						<span className="text-muted-foreground text-sm tabular-nums">
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
