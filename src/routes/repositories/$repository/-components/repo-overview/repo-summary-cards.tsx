import type { JSX } from "react";

import { H2, P } from "@/components/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RepoSummaryCards(props: {
	totalFiles: number;
	risky: number;
	acceptable: number;
	lowConf: number;
	selectedFilter: "all" | "risky" | "acceptable" | "low-conf";
	onSelectFilter: (filter: "all" | "risky" | "acceptable" | "low-conf") => void;
}): JSX.Element {
	const { totalFiles, risky, acceptable, lowConf, selectedFilter, onSelectFilter } = props;

	return (
		<section className="grid grid-cols-4 gap-2">
			<Card
				className={`cursor-pointer transition-all ${selectedFilter === "all" ? "border-primary" : "opacity-85"}`}
				onClick={() => onSelectFilter("all")}
			>
				<CardHeader>
					<H2 variant="p">Files Analyzed</H2>
				</CardHeader>
				<CardContent className="flex items-center gap-4">
					<P variant="h2">{totalFiles}</P>
				</CardContent>
			</Card>

			<Card
				className={`cursor-pointer transition-all ${selectedFilter === "risky" ? "border-destructive" : "opacity-85"}`}
				onClick={() => onSelectFilter("risky")}
			>
				<CardHeader>
					<H2 variant="p">Risky</H2>
				</CardHeader>
				<CardContent className="flex items-center gap-4">
					<P variant="h2">{risky}</P>
				</CardContent>
			</Card>

			<Card
				className={`cursor-pointer transition-all ${selectedFilter === "acceptable" ? "border-primary" : "opacity-85"}`}
				onClick={() => onSelectFilter("acceptable")}
			>
				<CardHeader>
					<H2 variant="p">Acceptable</H2>
				</CardHeader>
				<CardContent className="flex items-center gap-4">
					<P variant="h2">{acceptable}</P>
				</CardContent>
			</Card>

			<Card
				className={`cursor-pointer transition-all ${selectedFilter === "low-conf" ? "border-muted-foreground" : "opacity-85"}`}
				onClick={() => onSelectFilter("low-conf")}
			>
				<CardHeader>
					<H2 variant="p">Low Confidence</H2>
				</CardHeader>
				<CardContent className="flex items-center gap-4">
					<P variant="h2">{lowConf}</P>
				</CardContent>
			</Card>
		</section>
	);
}
