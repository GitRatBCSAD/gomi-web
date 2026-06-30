import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

import { H1, H2, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Heatmap } from "./-components/heatmap";

export const Route = createFileRoute("/repositories/$repository/")({
	component: RouteComponent,
});

function RouteComponent(): JSX.Element {
	return (
		<div className="mx-auto w-full space-y-2 max-w-7xl">
			<Card>
				<CardHeader>
					<H1>repo/name</H1>
				</CardHeader>

				<CardContent className="flex items-center gap-4">
					<P>main | (analysis_window) | (latest_commit_date)</P>

					<Badge>Public</Badge>
				</CardContent>
			</Card>

			<section className="grid grid-cols-4 gap-2">
				<Card>
					<CardHeader>
						<H2 variant="p">Files Analyzed</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">3</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Risky</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">1</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Acceptable</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">1</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Low Confidence</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">1</P>
					</CardContent>
				</Card>
			</section>

			<Heatmap />
		</div>
	);
}
