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
				Caution
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
	const [filter, setFilter] = useState<"all" | "caution">("all");

	if (file.lowConfidence) return null;

	const commits = [...file.commitSentiments].sort((a, b) => b.committedAt - a.committedAt);
	if (commits.length === 0) return null;

	const total = commits.length;
	const count = (code: string) => commits.filter((c) => c.sentiment?.code === code).length;
	const tooShort = commits.filter((c) => !c.sentiment).length;
	const labelled = total - tooShort;
	const groups = [
		{ code: "caution", color: "var(--risk-very-high-fill)", ink: "var(--risk-very-high-ink)" },
		{ code: "neutral", color: "var(--muted-foreground)", ink: "var(--foreground)" },
		{ code: "satisfaction", color: "var(--success-500)", ink: "var(--success-500)" },
	].map((g) => ({ ...g, n: count(g.code) }));
	const cautionShare = labelled ? groups[0].n / labelled : 0;

	const shown =
		filter === "all" ? commits : commits.filter((c) => c.sentiment?.code === "caution");
	const totalPages = Math.ceil(shown.length / PAGE_SIZE);
	const startIndex = (page - 1) * PAGE_SIZE;
	const pageCommits = shown.slice(startIndex, startIndex + PAGE_SIZE);

	return (
		<Card id={id}>
			<CardHeader>
				<H1 variant="h4">Tone of commit messages</H1>
				<P className="text-muted-foreground">
					{cautionShareLabel(cautionShare)}: {groups[0].n} of {labelled} readable messages
					in the last 6 months.
				</P>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
						{groups.map((g) =>
							g.n > 0 ? (
								<div key={g.code} style={{ flex: g.n, backgroundColor: g.color }} />
							) : null,
						)}
					</div>
					<ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
						{groups.map((g) => (
							<li key={g.code} title={labelled ? fmtPct(g.n / labelled) : undefined}>
								<span className="font-semibold" style={{ color: g.ink }}>
									{g.n}
								</span>{" "}
								{toneLabel(g.code).toLowerCase()}
							</li>
						))}
						{tooShort > 0 && (
							<li className="opacity-70">{tooShort} too short to read</li>
						)}
					</ul>
				</div>
				<div className="flex gap-2">
					{(["all", "caution"] as const).map((f) => (
						<Button
							key={f}
							variant={filter === f ? "secondary" : "outline"}
							size="sm"
							onClick={() => {
								setFilter(f);
								setPage(1);
							}}
						>
							{f === "all" ? `All ${total}` : `Caution ${groups[0].n}`}
						</Button>
					))}
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
