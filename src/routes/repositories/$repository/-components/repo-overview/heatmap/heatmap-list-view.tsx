import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type JSX } from "react";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

import { RiskBadge, SentimentBar } from "./heatmap-tile";
import type { FileInfo } from "./heatmap-utils";

const PAGE_SIZE = 25;

/** Returns page indices to render, with `null` meaning ellipsis. */
function pageWindows(current: number, total: number): (number | null)[] {
	if (total <= 9) return Array.from({ length: total }, (_, i) => i);
	const show = new Set<number>();
	show.add(0);
	show.add(total - 1);
	for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) show.add(i);
	const pages: (number | null)[] = [];
	let prev = -1;
	for (const p of [...show].sort((a, b) => a - b)) {
		if (prev !== -1 && p - prev > 1) pages.push(null);
		pages.push(p);
		prev = p;
	}
	return pages;
}

function ListRow(props: {
	file: FileInfo;
	threshold: number;
	even: boolean;
	onClick: () => void;
}): JSX.Element {
	const { file, threshold, even, onClick } = props;
	return (
		<tr
			className="border-border/40 group hover:bg-muted/30 cursor-pointer border-b transition-colors last:border-0"
			style={{
				backgroundColor: even ? "var(--background-900)" : "transparent",
			}}
			onClick={onClick}
		>
			<td className="px-4 py-3">
				<p className="text-sm leading-tight font-bold text-white">{file.name}</p>
				{file.dir && <p className="text-muted-foreground mt-0.5 text-xs">{file.dir}</p>}
			</td>
			<td className="w-36 px-4 py-3">
				<SentimentBar
					risky={file.sentimentRisky}
					caution={file.sentimentCaution}
					ok={file.sentimentOk}
					lowConf={file.lowConf}
				/>
			</td>
			<td className="px-4 py-3">
				<RiskBadge file={file} threshold={threshold} />
			</td>
			<td className="px-4 py-3 text-sm text-white">{file.commits}</td>
		</tr>
	);
}

export function HeatmapListView(props: {
	files: FileInfo[];
	threshold: number;
	repository: string;
}): JSX.Element {
	const { files, threshold, repository } = props;
	// ponytail: hoisted — avoids N useNavigate hook calls inside each ListRow
	const navigate = useNavigate();
	const [page, setPage] = useState(0);

	// Reset to page 0 whenever the file list changes (filter / sort / search)
	useEffect(() => {
		setPage(0);
	}, [files]);

	if (files.length === 0) {
		return (
			<div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
				No files match the current filter.
			</div>
		);
	}

	const totalPages = Math.ceil(files.length / PAGE_SIZE);
	const pageFiles = files.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
	const rangeStart = page * PAGE_SIZE + 1;
	const rangeEnd = Math.min((page + 1) * PAGE_SIZE, files.length);

	return (
		<div className="w-full">
			<div className="w-full overflow-x-auto">
				<table className="font-fira-mono w-full min-w-[520px]">
					<thead className="bg-card">
						<tr className="border-border border-b">
							<th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
								File
							</th>
							<th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
								Sentiment
							</th>
							<th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
								Risk
							</th>
							<th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">
								Commits
							</th>
						</tr>
					</thead>
					<tbody>
						{pageFiles.map((f, i) => (
							<ListRow
								key={`${f.dir}${f.name}`}
								file={f}
								threshold={threshold}
								even={(page * PAGE_SIZE + i) % 2 === 0}
								onClick={() =>
									navigate({
										to: "/repositories/$repository/file",
										params: { repository },
										search: { path: `${f.dir}${f.name}` },
									})
								}
							/>
						))}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="border-border/40 flex items-center justify-between border-t px-4 py-3">
					<span className="text-muted-foreground font-fira-mono text-xs">
						{rangeStart}–{rangeEnd} of {files.length} files
					</span>
					<Pagination className="mx-0 w-auto">
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault();
										setPage((p) => Math.max(0, p - 1));
									}}
									aria-disabled={page === 0}
									className={page === 0 ? "pointer-events-none opacity-30" : ""}
								/>
							</PaginationItem>

							{pageWindows(page, totalPages).map((p, idx) =>
								p === null ? (
									// eslint-disable-next-line react/no-array-index-key
									<PaginationItem key={`ellipsis-${idx}`}>
										<PaginationEllipsis />
									</PaginationItem>
								) : (
									<PaginationItem key={p}>
										<PaginationLink
											href="#"
											isActive={p === page}
											onClick={(e) => {
												e.preventDefault();
												setPage(p);
											}}
										>
											{p + 1}
										</PaginationLink>
									</PaginationItem>
								),
							)}

							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => {
										e.preventDefault();
										setPage((p) => Math.min(totalPages - 1, p + 1));
									}}
									aria-disabled={page === totalPages - 1}
									className={page === totalPages - 1 ? "pointer-events-none opacity-30" : ""}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
}
