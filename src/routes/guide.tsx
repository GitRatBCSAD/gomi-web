import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { JSX } from "react";

import { HeatmapLegendPreview, RiskLegendRows } from "@/components/heatmap-legend-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GLOSSARY } from "@/lib/glossary";

export const Route = createFileRoute("/guide")({
	component: Guide,
});

// The pipeline, told from the reader's side of the screen — what each stage
// does for you, not how it is wired.
const PIPELINE = [
	{
		n: "01",
		title: "Reads your commit messages",
		body: "Every commit message is scored for how worried or frustrated it sounds. Venting, 'temp fix', and 'no idea why this works' are signals, not noise.",
	},
	{
		n: "02",
		title: "Measures the code itself",
		body: "It sizes up each file's structure — how long its functions are and how tangled their branching is — ranked against the rest of your repo.",
	},
	{
		n: "03",
		title: "Combines them into one score",
		body: "Sentiment and structure are fused into a single risk score from 0 to 1: the chance this file is heading for a bug fix soon.",
	},
	{
		n: "04",
		title: "Explains every score",
		body: "No black box. Each score is broken down into the exact factors that raised or lowered it, so you can see why a file is flagged.",
	},
];

const STEPS = [
	{
		n: "1",
		title: "Connect a repository",
		body: "Install Gomi on GitHub and pick a repo to watch. Gomi only reads history — it never writes to your code.",
	},
	{
		n: "2",
		title: "Run an analysis",
		body: "Hit Analyze. Gomi walks the last six months of commits and files, then caches the result so you can reopen it instantly.",
	},
	{
		n: "3",
		title: "Read the heatmap",
		body: "Every file becomes a tile. Big, red tiles are your loud, risky files. Scan the map to see where debt is concentrated.",
	},
	{
		n: "4",
		title: "Drill into a file",
		body: "Click any tile for the full story — the risk breakdown, sentiment over time, and the single commit most responsible.",
	},
];

function Guide(): JSX.Element {
	return (
		<div className="mx-auto w-full max-w-4xl px-6 py-14">
			<Link
				to="/repositories"
				className="font-fira-mono text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeftIcon className="size-4" />
				Back to repositories
			</Link>

			{/* Hero */}
			<header className="pb-8">
				<span className="font-fira-mono text-primary text-[0.8125rem] tracking-wider">
					GOMI &bull; Field Guide
				</span>
				<h1 className="font-fira-mono-bold text-foreground mt-4 text-[clamp(2rem,5vw,3rem)] leading-tight">
					Read your repo like a <span className="text-primary">heatmap</span>
				</h1>
				<p className="font-fira-mono text-muted-foreground mt-4 max-w-2xl text-[0.9375rem] leading-relaxed">
					Gomi flags risky files before a bug is ever filed, by reading two things at
					once: how your code is built, and how your developers write about it.
				</p>
			</header>

			<Tabs defaultValue="overview" className="gap-6">
				<TabsList variant="line" className="border-border border-b pb-0">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="map">Reading the map</TabsTrigger>
					<TabsTrigger value="how">How it works</TabsTrigger>
					<TabsTrigger value="glossary">Glossary</TabsTrigger>
				</TabsList>

				{/* Overview — the workflow */}
				<TabsContent value="overview" className="pt-2">
					<h2 className="font-fira-mono-bold text-foreground mb-6 text-xl">
						From install to insight
					</h2>
					<ol className="space-y-6">
						{STEPS.map((s) => (
							<li key={s.n} className="flex gap-4">
								<span className="border-primary/30 text-primary font-fira-mono-bold flex size-9 shrink-0 items-center justify-center rounded-full border text-sm">
									{s.n}
								</span>
								<div className="pt-1">
									<h3 className="font-fira-mono-bold text-foreground text-base">
										{s.title}
									</h3>
									<p className="font-fira-mono text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
										{s.body}
									</p>
								</div>
							</li>
						))}
					</ol>
				</TabsContent>

				{/* Reading the map */}
				<TabsContent value="map" className="pt-2">
					<div className="grid gap-8 md:grid-cols-[1fr_auto]">
						<div>
							<h2 className="font-fira-mono-bold text-foreground mb-3 text-xl">
								Size is structure. Color is risk.
							</h2>
							<p className="font-fira-mono text-muted-foreground mb-6 max-w-md text-sm leading-relaxed">
								On the repository heatmap, each file is a tile.{" "}
								<span className="text-foreground">Bigger tiles</span> are
								structurally heavier files.{" "}
								<span className="text-foreground">Redder tiles</span> carry more
								risk. The file you want to look at first is the big red one.
							</p>
							<RiskLegendRows />
						</div>
						<HeatmapLegendPreview />
					</div>
				</TabsContent>

				{/* How it works */}
				<TabsContent value="how" className="pt-2">
					<h2 className="font-fira-mono-bold text-foreground mb-6 text-xl">
						How Gomi thinks
					</h2>
					<div className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
						{PIPELINE.map((p) => (
							<div key={p.n} className="bg-card p-6">
								<span className="font-fira-mono-bold text-primary/50 text-3xl tabular-nums">
									{p.n}
								</span>
								<h3 className="font-fira-mono-bold text-foreground mt-2 text-base">
									{p.title}
								</h3>
								<p className="font-fira-mono text-muted-foreground mt-2 text-sm leading-relaxed">
									{p.body}
								</p>
							</div>
						))}
					</div>
				</TabsContent>

				{/* Glossary */}
				<TabsContent value="glossary" className="pt-2">
					<h2 className="font-fira-mono-bold text-foreground mb-2 text-xl">
						Every term, in plain language
					</h2>
					<p className="font-fira-mono text-muted-foreground mb-6 max-w-2xl text-sm leading-relaxed">
						The same definitions behind the <span className="text-foreground">ⓘ</span>{" "}
						icons throughout a file's analysis.
					</p>
					<div className="grid gap-3 sm:grid-cols-2">
						{Object.entries(GLOSSARY).map(([key, entry]) => (
							<div key={key} className="border-border bg-card rounded-lg border p-4">
								<p className="font-fira-mono-bold text-primary text-sm">
									{entry.title}
								</p>
								<p className="font-fira-mono text-muted-foreground mt-1.5 text-xs leading-relaxed">
									{entry.definition}
								</p>
								<a
									href={entry.href}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:text-primary/80 font-fira-mono mt-2.5 inline-block text-[11px] transition-colors"
								>
									Learn more →
								</a>
							</div>
						))}
					</div>
				</TabsContent>
			</Tabs>

			<div className="border-border mt-12 border-t pt-10 text-center">
				<Link
					to="/repositories"
					className="bg-primary font-fira-mono-bold hover:bg-primary/90 text-primary-foreground inline-flex cursor-pointer items-center justify-center rounded-lg px-8 py-3 text-sm no-underline transition-all"
				>
					Go to your repositories
				</Link>
			</div>
		</div>
	);
}
