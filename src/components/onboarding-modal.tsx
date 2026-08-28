import { GithubIcon, XIcon } from "lucide-react";
import { useState, type JSX, type ReactNode } from "react";

import { HeatmapLegendPreview, RiskLegendRows } from "@/components/heatmap-legend-preview";
import { Button } from "@/components/ui/button";

interface Step {
	eyebrow: string;
	title: ReactNode;
	body: string;
	visual?: ReactNode;
}

const STEPS: Step[] = [
	{
		eyebrow: "WELCOME TO GOMI",
		title: (
			<>
				Catch debt <span className="text-primary">before</span> it breaks you
			</>
		),
		body: "Gomi flags risky files before a single bug is filed. It reads two things at once — how your code is built, and how your team writes about it — and turns your repository into a heatmap you can scan in seconds.",
	},
	{
		eyebrow: "READING THE MAP",
		title: (
			<>
				Size is structure. <span className="text-primary">Color is risk.</span>
			</>
		),
		body: "Every file is a tile. Bigger tiles are structurally heavier files; redder tiles carry more risk. The one to look at first is the big red one. Hatched tiles just don't have enough history to score yet.",
		visual: <HeatmapLegendPreview />,
	},
	{
		eyebrow: "TWO SIGNALS, ONE SCORE",
		title: (
			<>
				Your code <span className="text-primary">and</span> your commit messages
			</>
		),
		body: "Static analysis measures complexity. A sentiment model reads your commit messages for frustration and caution. Gomi fuses both into a single risk score — and breaks down exactly why each file was flagged, so nothing is a black box.",
		visual: <RiskLegendRows />,
	},
	// The final step is filled in per install state at render time.
	{ eyebrow: "", title: null, body: "" },
];

/**
 * First-run onboarding shown once per user on the repositories screen. Purely
 * presentational — the parent owns whether it renders and what "done" does.
 * The last step adapts to install state: an uninstalled user is pointed at
 * installing the GitHub App; an installed one, at analyzing a repo.
 */
export function OnboardingModal({
	onClose,
	notInstalled,
	installUrl,
}: {
	onClose: () => void;
	notInstalled: boolean;
	installUrl: string;
}): JSX.Element {
	const [step, setStep] = useState(0);
	const isLast = step === STEPS.length - 1;
	const current: Step = isLast
		? notInstalled
			? {
					eyebrow: "ONE STEP FIRST",
					title: (
						<>
							Install the <span className="text-primary">GitHub App</span>
						</>
					),
					body: "Gomi needs read access to a repository before it can analyze anything. Install the app, choose which repos to share, and you'll come right back here to start scanning. Every technical term has an ⓘ you can hover for a plain-language definition.",
				}
			: {
					eyebrow: "YOU'RE SET",
					title: <>Analyze your first repository</>,
					body: "Pick a repo below and hit Analyze. Gomi reads the last six months of history — it never writes to your code — and caches the result so you can reopen it instantly. Every technical term has an ⓘ you can hover for a plain-language definition.",
				}
		: STEPS[step];

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
			<div className="bg-background-900 border-border/40 relative flex w-full max-w-lg flex-col gap-5 rounded-2xl border p-8 shadow-2xl">
				<button
					onClick={onClose}
					aria-label="Skip onboarding"
					className="text-muted-foreground hover:text-foreground absolute top-5 right-5 cursor-pointer transition-colors"
				>
					<XIcon className="size-4" />
				</button>

				<div>
					<p className="font-fira-mono text-primary text-[0.75rem] tracking-wider">
						{current.eyebrow}
					</p>
					<h2 className="font-fira-mono-bold mt-2 text-2xl leading-tight text-white">
						{current.title}
					</h2>
				</div>

				{current.visual && <div className="flex justify-center">{current.visual}</div>}

				<p className="font-fira-mono text-muted-foreground text-sm leading-relaxed">
					{current.body}
				</p>

				<div className="mt-1 flex items-center justify-between">
					{/* Progress dots */}
					<div className="flex items-center gap-2">
						{STEPS.map((_, i) => (
							<button
								key={i}
								onClick={() => setStep(i)}
								aria-label={`Go to step ${i + 1}`}
								className="size-2 cursor-pointer rounded-full transition-colors"
								style={{
									backgroundColor:
										i === step
											? "var(--primary-500)"
											: "color-mix(in srgb, var(--foreground) 20%, transparent)",
								}}
							/>
						))}
					</div>

					<div className="flex items-center gap-2">
						{!isLast && (
							<Button variant="outline" size="sm" onClick={onClose}>
								Skip
							</Button>
						)}
						{!isLast ? (
							<Button size="sm" onClick={() => setStep(step + 1)}>
								Next
							</Button>
						) : notInstalled ? (
							<Button
								size="sm"
								nativeButton={false}
								onClick={onClose}
								render={
									<a href={installUrl} target="_blank" rel="noopener noreferrer" />
								}
							>
								<GithubIcon className="size-4" />
								Install Gomi App
							</Button>
						) : (
							<Button size="sm" onClick={onClose}>
								<GithubIcon className="size-4" />
								Let's go
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
