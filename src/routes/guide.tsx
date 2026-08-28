import { createFileRoute, Link } from "@tanstack/react-router";
import type { JSX } from "react";

import { GLOSSARY } from "@/lib/glossary";

import {
	HATCH,
	LEGEND_GRADIENT,
	riskColor,
} from "./repositories/$repository/-components/repo-overview/heatmap/heatmap-utils";

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

// A few sample tiles for the legend — width encodes complexity, color encodes
// risk, the hatched one is low-confidence. Same riskColor + HATCH the live map uses.
const SAMPLE_TILES = [
	{ name: "auth.go", risk: 0.86, w: 132, lowConf: false },
	{ name: "parser.ts", risk: 0.58, w: 104, lowConf: false },
	{ name: "utils.py", risk: 0.24, w: 72, lowConf: false },
	{ name: "cli.rs", risk: 0.35, w: 60, lowConf: true },
];

function SectionLabel({ children }: { children: string }): JSX.Element {
	return (
		<p className="font-fira-mono text-primary mb-6 text-[0.8125rem] tracking-wider">
			{children}
		</p>
	);
}

function Guide(): JSX.Element {
	return (
		<div className="mx-auto w-full max-w-4xl px-6 py-14">
			{/* Hero */}
			<header className="border-b border-white/10 pb-12">
				<span className="font-fira-mono text-primary text-[0.8125rem] tracking-wider">
					GOMI &bull; Field Guide
				</span>
				<h1 className="font-fira-mono-bold mt-4 text-[clamp(2rem,5vw,3rem)] leading-tight text-white">
					Read your repo like a <span className="text-primary">heatmap</span>
				</h1>
				<p className="font-fira-mono mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-gray-400">
					Gomi flags risky files before a bug is ever filed. It does this by reading two
					things at once: how your code is built, and how your developers write about it.
					This guide explains what you are looking at and how to use it.
				</p>
			</header>

			{/* Reading the heatmap — the signature */}
			<section className="border-b border-white/10 py-12">
				<SectionLabel>READING THE MAP</SectionLabel>
				<div className="grid gap-8 md:grid-cols-[1fr_auto]">
					<div>
						<h2 className="font-fira-mono-bold mb-3 text-2xl text-white">
							Size is structure. Color is risk.
						</h2>
						<p className="font-fira-mono mb-6 max-w-md text-sm leading-relaxed text-gray-400">
							On the repository heatmap, each file is a tile.{" "}
							<span className="text-white">Bigger tiles</span> are structurally heavier
							files. <span className="text-white">Redder tiles</span> carry more risk.
							The file you want to look at first is the big red one.
						</p>
						<ul className="font-fira-mono space-y-2.5 text-sm text-gray-400">
							<li className="flex items-center gap-3">
								<span
									className="inline-block size-4 shrink-0 rounded-sm"
									style={{ backgroundColor: riskColor(0.85) }}
								/>
								High risk — likely heading for a fix
							</li>
							<li className="flex items-center gap-3">
								<span
									className="inline-block size-4 shrink-0 rounded-sm"
									style={{ backgroundColor: riskColor(0.5) }}
								/>
								Moderate — worth a glance
							</li>
							<li className="flex items-center gap-3">
								<span
									className="inline-block size-4 shrink-0 rounded-sm"
									style={{ backgroundColor: riskColor(0.15) }}
								/>
								Low — quiet and stable
							</li>
							<li className="flex items-center gap-3">
								<span
									className="border-dark-500 inline-block size-4 shrink-0 rounded-sm border"
									style={{ backgroundImage: HATCH, backgroundColor: "#1a1c1f" }}
								/>
								Hatched — too few commits to score confidently
							</li>
						</ul>
					</div>

					{/* Mini heatmap mock */}
					<div className="flex flex-col items-start gap-2 self-start rounded-lg border border-white/10 bg-[#0b0d10] p-4">
						<div className="flex flex-wrap items-end gap-1.5" style={{ maxWidth: 200 }}>
							{SAMPLE_TILES.map((t) => (
								<div
									key={t.name}
									className="border-dark-500 relative overflow-hidden border"
									style={{
										width: t.w,
										height: t.w * 0.62,
										backgroundColor: riskColor(t.risk),
									}}
									title={`${t.name} — ${t.lowConf ? "low confidence" : t.risk.toFixed(2)}`}
								>
									{t.lowConf && (
										<div
											className="absolute inset-0"
											style={{ backgroundImage: HATCH }}
										/>
									)}
									<span className="font-fira-mono absolute right-1 bottom-1 left-1 truncate text-[10px] text-white/80">
										{t.name}
									</span>
								</div>
							))}
						</div>
						<div
							className="mt-1 h-2 w-full rounded-full"
							style={{ backgroundImage: LEGEND_GRADIENT }}
						/>
						<div className="font-fira-mono flex w-full justify-between text-[10px] text-gray-500">
							<span>low risk</span>
							<span>high risk</span>
						</div>
					</div>
				</div>
			</section>

			{/* Pipeline */}
			<section className="border-b border-white/10 py-12">
				<SectionLabel>HOW GOMI THINKS</SectionLabel>
				<div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2">
					{PIPELINE.map((p) => (
						<div key={p.n} className="bg-[#0b0d10] p-6">
							<span className="font-fira-mono-bold text-primary/50 text-3xl tabular-nums">
								{p.n}
							</span>
							<h3 className="font-fira-mono-bold mt-2 text-base text-white">
								{p.title}
							</h3>
							<p className="font-fira-mono mt-2 text-sm leading-relaxed text-gray-400">
								{p.body}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Using it */}
			<section className="border-b border-white/10 py-12">
				<SectionLabel>USING GOMI</SectionLabel>
				<ol className="space-y-6">
					{STEPS.map((s) => (
						<li key={s.n} className="flex gap-4">
							<span className="border-primary/30 text-primary font-fira-mono-bold flex size-9 shrink-0 items-center justify-center rounded-full border text-sm">
								{s.n}
							</span>
							<div className="pt-1">
								<h3 className="font-fira-mono-bold text-base text-white">
									{s.title}
								</h3>
								<p className="font-fira-mono mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">
									{s.body}
								</p>
							</div>
						</li>
					))}
				</ol>
			</section>

			{/* Glossary */}
			<section className="py-12">
				<SectionLabel>GLOSSARY</SectionLabel>
				<h2 className="font-fira-mono-bold mb-2 text-2xl text-white">
					Every term, in plain language
				</h2>
				<p className="font-fira-mono mb-8 max-w-2xl text-sm leading-relaxed text-gray-400">
					These are the same definitions behind the{" "}
					<span className="text-white">ⓘ</span> icons throughout a file's analysis. Tap any
					link to read the authoritative source.
				</p>
				<div className="grid gap-3 sm:grid-cols-2">
					{Object.entries(GLOSSARY).map(([key, entry]) => (
						<div
							key={key}
							className="rounded-lg border border-white/10 bg-[#0b0d10] p-4"
						>
							<p className="font-fira-mono-bold text-primary text-sm">{entry.title}</p>
							<p className="font-fira-mono mt-1.5 text-xs leading-relaxed text-gray-400">
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
			</section>

			<div className="border-t border-white/10 pt-10 text-center">
				<Link
					to="/repositories"
					className="bg-primary font-fira-mono-bold hover:bg-primary/90 inline-flex cursor-pointer items-center justify-center rounded-lg px-8 py-3 text-sm text-black no-underline transition-all"
				>
					Go to your repositories
				</Link>
			</div>
		</div>
	);
}
