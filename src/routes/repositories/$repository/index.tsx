import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, Link, useRouter } from "@tanstack/react-router";
import { useState, type JSX } from "react";

import { H1, H2, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardAction } from "@/components/ui/card";
import { analyzeRepository, getRepositoriesQuery } from "@/lib/github/api";
import { loadAnalysis, saveAnalysis } from "@/lib/github/model";

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
	const router = useRouter();
	const [showConfirm, setShowConfirm] = useState(false);

	const reposQuery = useQuery(getRepositoriesQuery);

	const risky = analysis.fileResults.filter(
		(f) => !f.lowConfidence && f.riskScore != null && f.riskScore >= analysis.threshold,
	).length;
	const acceptable = analysis.fileResults.filter(
		(f) => !f.lowConfidence && f.riskScore != null && f.riskScore < analysis.threshold,
	).length;
	const lowConf = analysis.fileResults.filter((f) => f.lowConfidence).length;

	const repoName = analysis.repoUrl
		.replace(/\.git$/, "")
		.split("/")
		.slice(-2)
		.join("/");

	const analyzeMutation = useMutation({
		mutationFn: analyzeRepository,
		onSuccess: (data) => {
			saveAnalysis(repoName, data);
			router.invalidate();
		},
		onError: (error) => {
			console.error("Reanalysis failed:", error);
		},
	});

	return (
		<div className="mx-auto w-full max-w-7xl space-y-2 p-4">
			<Card>
				<CardHeader>
					<H1>{repoName}</H1>
					<CardAction className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={analyzeMutation.isPending}
							onClick={() => setShowConfirm(true)}
						>
							{analyzeMutation.isPending ? "Reanalyzing..." : "Reanalyze"}
						</Button>
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<Link to="/repositories" />}
						>
							Select Other Repo
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="flex items-center gap-4">
					<Badge>Public</Badge>
					{analyzeMutation.isError && (
						<p className="text-destructive font-fira-mono text-xs">
							Reanalysis failed: {analyzeMutation.error?.message}
						</p>
					)}
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

			<Heatmap
				fileResults={analysis.fileResults}
				threshold={analysis.threshold}
				repository={repoName}
			/>

			{showConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
					<div className="bg-background-900 border-border/40 flex w-full max-w-md flex-col gap-4 rounded-2xl border p-6 shadow-2xl">
						<h2 className="font-fira-mono-bold text-foreground text-xl">
							Reanalyze {repoName}?
						</h2>
						<p className="font-fira-mono text-muted-foreground text-xs leading-relaxed">
							Are you sure you want to reanalyze {repoName}? This will re-run static code analysis and sentiment extraction.
						</p>
						<div className="flex justify-end gap-3 pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowConfirm(false)}
							>
								No
							</Button>
							<Button
								size="sm"
								disabled={analyzeMutation.isPending}
								onClick={() => {
									setShowConfirm(false);
									const [owner, name] = repoName.split("/");
									const repoMatch = reposQuery.data?.repositories.find(
										(r) => r.fullName === repoName,
									);
									analyzeMutation.mutate({
										id: repoMatch ? String(repoMatch.id) : "",
										owner,
										repository: name,
										force: true,
									});
								}}
							>
								Yes
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

