import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState, type JSX } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { FileRiskResult } from "@/lib/github/model";

function SentimentBadge({ code }: { code: string | undefined }): JSX.Element {
	if (code === "caution") {
		return (
			<span
				className="font-fira-mono shrink-0 rounded px-2 py-0.5 text-xs"
				style={{
					backgroundColor: "var(--destructive-900)",
					color: "var(--destructive-500)",
				}}
			>
				Caution
			</span>
		);
	}
	if (code === "satisfaction") {
		return (
			<span
				className="font-fira-mono shrink-0 rounded px-2 py-0.5 text-xs"
				style={{
					backgroundColor: "var(--success-900)",
					color: "var(--success-500)",
				}}
			>
				Satisfaction
			</span>
		);
	}
	return (
		<span
			className="font-fira-mono shrink-0 rounded px-2 py-0.5 text-xs"
			style={{
				backgroundColor: "var(--background-700)",
				color: "var(--text-subtle)",
			}}
		>
			Neutral
		</span>
	);
}

function timeAgo(ts: number): string {
	const days = Math.floor(Date.now() / 1000 / 86400 - ts / 86400);
	if (days === 0) return "today";
	if (days === 1) return "1 day ago";
	return `${days} days ago`;
}

export function CommitSentimentCard({ file }: { file: FileRiskResult }): JSX.Element {
	const [page, setPage] = useState(1);
	const pageSize = 5;

	const commits = [...file.commitSentiments].sort((a, b) => b.committedAt - a.committedAt);
	const total = commits.length;
	const totalPages = Math.max(Math.ceil(total / pageSize), 1);

	const cautionCount = commits.filter((c) => c.sentiment?.code === "caution").length;
	const neutralCount = commits.filter((c) => c.sentiment?.code === "neutral").length;
	const satisfactionCount = commits.filter((c) => c.sentiment?.code === "satisfaction").length;
	const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

	const paginatedCommits = commits.slice((page - 1) * pageSize, page * pageSize);

	const tiles = [
		{
			label: "Caution",
			count: cautionCount,
			color: "var(--destructive-500)",
			bg: "color-mix(in srgb, var(--destructive-900) 80%, transparent)",
		},
		{
			label: "Neutral",
			count: neutralCount,
			color: "var(--foreground)",
			bg: "var(--background-800)",
		},
		{
			label: "Satisfaction",
			count: satisfactionCount,
			color: "var(--success-500)",
			bg: "color-mix(in srgb, var(--success-900) 80%, transparent)",
		},
	];

	return (
		<Card>
			<CardHeader>
				<p className="font-fira-mono-bold text-foreground text-xl">Commit sentiment</p>
				<p className="font-fira-mono text-muted-foreground mt-1 text-xs tracking-widest uppercase">
					{total} commits analyzed by DistilBERT · 6-month window
				</p>
			</CardHeader>
			<CardContent className="space-y-4">
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(3, 1fr)",
						gap: "0.75rem",
					}}
				>
					{tiles.map(({ label, count, color, bg }) => (
						<div
							key={label}
							style={{
								borderRadius: "0.5rem",
								border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
								padding: "1rem",
								backgroundColor: bg,
							}}
						>
							<p className="font-fira-mono mb-1 text-sm" style={{ color }}>
								{label}
							</p>
							<p className="font-fira-mono-bold text-3xl" style={{ color }}>
								{pct(count)}%
							</p>
							<p className="font-fira-mono text-muted-foreground mt-1 text-xs">
								{count} of {total} commits
							</p>
						</div>
					))}
				</div>

				<div>
					<div className="flex items-center justify-between mb-2">
						<p className="font-fira-mono text-muted-foreground text-xs tracking-widest uppercase">
							Commits ({total})
						</p>
						{totalPages > 1 && (
							<span className="font-fira-mono text-muted-foreground text-xs">
								Page {page} of {totalPages}
							</span>
						)}
					</div>
					<div
						style={{
							borderRadius: "0.5rem",
							border: "1px solid color-mix(in srgb, var(--border) 30%, transparent)",
							overflow: "hidden",
							backgroundColor: "var(--background-800)",
						}}
					>
						{paginatedCommits.length === 0 ? (
							<p className="font-fira-mono text-muted-foreground px-4 py-3 text-sm">
								No commits in window.
							</p>
						) : (
							paginatedCommits.map((c) => (
								<div
									key={c.hash}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.75rem",
										padding: "0.75rem 1rem",
										borderBottom:
											"1px solid color-mix(in srgb, var(--border) 20%, transparent)",
									}}
								>
									<div style={{ flex: 1, minWidth: 0 }}>
										<p
											className="font-fira-mono text-foreground text-sm"
											style={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											"{c.message}"
										</p>
										<p className="font-fira-mono text-muted-foreground mt-0.5 text-xs">
											{c.hash.slice(0, 7)} · {timeAgo(c.committedAt)}
											{c.lowInfo && " · low info"}
										</p>
									</div>
									<SentimentBadge code={c.sentiment?.code} />
								</div>
							))
						)}
					</div>

					{totalPages > 1 && (
						<div className="flex items-center justify-between mt-3 px-1">
							<p className="font-fira-mono text-muted-foreground text-xs">
								Showing {(page - 1) * pageSize + 1}–
								{Math.min(page * pageSize, total)} of {total}
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1}
									onClick={() => setPage((p) => Math.max(p - 1, 1))}
								>
									<ChevronLeftIcon className="size-3.5" />
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= totalPages}
									onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
								>
									Next
									<ChevronRightIcon className="size-3.5" />
								</Button>
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

