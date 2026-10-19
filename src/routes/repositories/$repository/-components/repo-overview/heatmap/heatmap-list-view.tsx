import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type JSX } from "react";

import { RiskLabel } from "@/components/risk-label";
import { P } from "@/components/typography";
import { cautionShareLabel } from "@/lib/interpret";

import { SentimentBar } from "./heatmap-tile";
import type { FileInfo } from "./heatmap-utils";

const ROW_HEIGHT = 60;
const LIST_VIEWPORT_HEIGHT = 600;

function ListRow(props: { file: FileInfo; even: boolean; onClick: () => void }): JSX.Element {
	const { file, even, onClick } = props;
	return (
		<tr
			className="border-border/40 group hover:bg-muted/30 cursor-pointer border-b transition-colors last:border-0"
			style={{
				backgroundColor: even ? "color-mix(in srgb, var(--muted) 35%, transparent)" : "transparent",
			}}
			onClick={onClick}
		>
			<td className="px-4 py-3">
				<P className="text-foreground text-sm leading-tight font-medium">{file.name}</P>
				{file.dir && <P className="text-muted-foreground mt-0.5 font-mono text-xs">{file.dir}</P>}
			</td>
			<td className="w-36 px-4 py-3">
				<SentimentBar
					risky={file.sentimentRisky}
					caution={file.sentimentCaution}
					ok={file.sentimentOk}
					lowConf={file.lowConf}
				/>
				{!file.lowConf && file.commits > 0 && (
					<P className="text-muted-foreground mt-1 text-xs">
						{cautionShareLabel(file.sentimentRisky)}
					</P>
				)}
			</td>
			<td className="px-4 py-3">
				<RiskLabel band={file.band} score={file.lowConf ? null : file.risk} size="xs" />
			</td>
			<td className="text-foreground px-4 py-3 text-right font-mono text-sm tabular-nums">{file.commits}</td>
		</tr>
	);
}

export function HeatmapListView(props: { files: FileInfo[]; repository: string }): JSX.Element {
	const { files, repository } = props;
	// ponytail: hoisted — avoids N useNavigate hook calls inside each ListRow
	const navigate = useNavigate();
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: files.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 10,
	});

	if (files.length === 0) {
		return (
			<div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
				No files match the current filter.
			</div>
		);
	}

	const items = virtualizer.getVirtualItems();
	const totalSize = virtualizer.getTotalSize();
	const paddingTop = items.length > 0 ? items[0].start : 0;
	const paddingBottom = items.length > 0 ? totalSize - items[items.length - 1].end : 0;

	return (
		<div
			ref={parentRef}
			style={{ height: LIST_VIEWPORT_HEIGHT, overflowY: "auto" }}
			className="w-full overflow-x-auto"
		>
			<table className="w-full min-w-[520px]">
				<thead className="bg-card sticky top-0 z-10">
					<tr className="border-border border-b">
						<th className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium">
							File
						</th>
						<th className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium">
							Commit tone
						</th>
						<th className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium">
							Risk
						</th>
						<th className="text-muted-foreground px-4 py-2.5 text-right text-sm font-medium">
							Changes
						</th>
					</tr>
				</thead>
				<tbody>
					{paddingTop > 0 && (
						<tr>
							<td style={{ height: paddingTop }} />
						</tr>
					)}
					{items.map((vRow) => {
						const f = files[vRow.index];
						return (
							<ListRow
								key={`${f.dir}${f.name}`}
								file={f}
								even={vRow.index % 2 === 0}
								onClick={() =>
									navigate({
										to: "/repositories/$repository/file",
										params: { repository },
										search: { path: `${f.dir}${f.name}` },
									})
								}
							/>
						);
					})}
					{paddingBottom > 0 && (
						<tr>
							<td style={{ height: paddingBottom }} />
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
