import { useNavigate } from "@tanstack/react-router";
import type { JSX } from "react";

import { RiskBadge, SentimentBar } from "./heatmap-tile";
import type { FileInfo } from "./heatmap-utils";

export function ListRow(props: {
	file: FileInfo;
	threshold: number;
	even: boolean;
	repository: string;
}): JSX.Element {
	const { file, threshold, even, repository } = props;
	const navigate = useNavigate();
	return (
		<tr
			className="border-border/40 group hover:bg-muted/30 cursor-pointer border-b transition-colors last:border-0"
			style={{
				backgroundColor: even ? "var(--background-900)" : "transparent",
			}}
			onClick={() =>
				navigate({
					to: "/repositories/$repository/file",
					params: { repository },
					search: { path: `${file.dir}${file.name}` },
				})
			}
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
	if (props.files.length === 0) {
		return (
			<div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
				No files match the current filter.
			</div>
		);
	}

	return (
		<div className="w-full overflow-x-auto">
			<table className="font-fira-mono w-full min-w-[520px]">
				<thead>
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
					{props.files.map((f, i) => (
						<ListRow
							key={`${f.dir}${f.name}`}
							file={f}
							threshold={props.threshold}
							even={i % 2 === 0}
							repository={props.repository}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
