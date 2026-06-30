import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

import { H1, H2, P } from "@/components/typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/repositories/$repository/")({
	component: RouteComponent,
});

function RouteComponent(): JSX.Element {
	return (
		<div className="mx-auto w-full max-w-3xl space-y-2">
			<Card>
				<CardHeader>
					<H1>repo/name</H1>
				</CardHeader>

				<CardContent className="flex items-center gap-4">
					<P>main</P>

					<Badge>Public</Badge>
				</CardContent>
			</Card>

			<section className="grid gap-2 grid-cols-4">
				<Card>
					<CardHeader>
						<H2 variant="p">Files Analyzed</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">42</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">High Risk</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">1</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Moderate</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">1</P>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<H2 variant="p">Low Risk</H2>
					</CardHeader>

					<CardContent className="flex items-center gap-4">
						<P variant="h2">1</P>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
