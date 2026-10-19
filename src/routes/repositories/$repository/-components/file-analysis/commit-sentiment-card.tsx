import { useState, type JSX } from "react";

import { H1, P } from "@/components/typography";
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
				className="text-[11px]"
				style={{
					backgroundColor: "var(--risk-very-high-tint)",
					color: "var(--risk-very-high-ink)",
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
				className="text-[11px]"
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
			className="text-[11px]"
			style={{
				backgroundColor: "var(--risk-none-fill)",
				color: "var(--risk-none-text)",
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
		{ code: "caution", color: "var(--risk-very-high-fill)" },
		{ code: "neutral", color: "var(--muted-foreground)" },
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
				<div className="space-y-2">
					<div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
						{groups.map((g) =>
							g.n > 0 ? (
								<div key={g.code} style={{ flex: g.n, backgroundColor: g.color }} />
							) : null,
						)}
					</div>
					<ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
						{groups.map((g) => (
							<li key={g.code} className="text-muted-foreground flex items-baseline gap-1.5">
								<span className="size-2 self-center rounded-full" style={{ backgroundColor: g.color }} />
								<span className="text-foreground font-medium">
									{labelled ? fmtPct(g.n / labelled) : "—"}
								</span>
								{toneLabel(g.code).toLowerCase()} · {g.n} of {labelled}
							</li>
						))}
					</ul>
				</div>
				<ul className="divide-border divide-y border-y">
					{pageCommits.map((c) => (
						<li key={c.hash} className="flex items-center justify-between gap-3 py-3">
							<div className="min-w-0 flex-1">
								<P className="text-foreground truncate text-sm">{c.message}</P>
								<P className="text-muted-foreground mt-0.5 text-xs">
									{fmtDate(c.committedAt)}
									{c.author ? ` · ${c.author}` : ""} ·{" "}
									<span className="font-mono" title="Commit ID">
										{c.hash.slice(0, 7)}
									</span>
								</P>
							</div>
							{c.lowInfo ? (
								<Badge
									className="text-[11px]"
									style={{
										backgroundColor: "var(--risk-none-fill)",
										color: "var(--risk-none-text)",
										borderColor: "transparent",
									}}
								>
									Too short to read
								</Badge>
							) : (
								<SentimentBadge code={c.sentiment?.code ?? null} />
							)}
						</li>
					))}
				</ul>

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
