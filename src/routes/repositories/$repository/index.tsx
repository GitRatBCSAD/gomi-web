import { createFileRoute, redirect } from "@tanstack/react-router";
import type { JSX } from "react";

import { H1, H2, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { loadAnalysis } from "@/lib/github/model";

import { Heatmap } from "./-components/heatmap";

export const Route = createFileRoute("/repositories/$repository/")({
	component: RouteComponent,
	loader: ({ params }) => {
		const result = loadAnalysis(params.repository);
		if (!result) throw redirect({ to: "/repositories" });
		return result;
	},
});

function RouteComponent(): JSX.Element {
	const analysis = Route.useLoaderData();

	const risky = analysis.fileResults.filter(
		(f) => !f.lowConfidence && f.riskScore >= analysis.threshold,
	).length;
	const acceptable = analysis.fileResults.filter(
		(f) => !f.lowConfidence && f.riskScore < analysis.threshold,
	).length;
	const lowConf = analysis.fileResults.filter((f) => f.lowConfidence).length;

	const repoName = analysis.repoUrl
		.replace(/\.git$/, "")
		.split("/")
		.slice(-2)
		.join("/");

	return (
		<div className="mx-auto w-full max-w-7xl space-y-2 p-4">
			<Card>
				<CardHeader>
					<H1>{repoName}</H1>
				</CardHeader>

				<CardContent className="flex items-center gap-4">
					<Badge>{analysis.status}</Badge>
				</CardContent>
			</Card>

			<section className="grid grid-cols-4 gap-2">
				<Card>
					<CardHeader>
						<H2 variant="p">Files Analyzed</H2>
					</CardHeader>
					<CardContent className="flex items-center gap-4">
						<P variant="h2">{analysis.fileResults.length}</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Risky</H2>
					</CardHeader>
					<CardContent className="flex items-center gap-4">
						<P variant="h2">{risky}</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Acceptable</H2>
					</CardHeader>
					<CardContent className="flex items-center gap-4">
						<P variant="h2">{acceptable}</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Low Confidence</H2>
					</CardHeader>
					<CardContent className="flex items-center gap-4">
						<P variant="h2">{lowConf}</P>
					</CardContent>
				</Card>
			</section>

			<Heatmap fileResults={analysis.fileResults} threshold={analysis.threshold} />
		</div>
	);
}
