import type { TourStepDetails } from "@ark-ui/react";
import { useEffect, useState, type JSX } from "react";

import { GuidedTour } from "@/components/guided-tour";

interface Candidate {
	id: string;
	selector: string;
	placement: "top" | "bottom";
	title: string;
	description: string;
}

const CANDIDATES: Candidate[] = [
	{
		id: "header",
		selector: "#tour-file-header",
		placement: "bottom",
		title: "Your file's risk score",
		description:
			"A 0-to-1 estimate of how likely this file is to need a bug fix soon. It blends code structure with commit sentiment into one number.",
	},
	{
		id: "sentiment",
		selector: "#tour-file-sentiment",
		placement: "top",
		title: "Sentiment trajectory",
		description:
			"How cautious commit messages sounded over time, with a smoothed trend line. Spikes mark moments worth a closer look.",
	},
	{
		id: "rootcause",
		selector: "#tour-file-rootcause",
		placement: "top",
		title: "Root cause commit",
		description:
			"When risk spikes, Gomi finds the single commit most responsible and explains whether it was driven by sentiment or by structural change.",
	},
	{
		id: "commits",
		selector: "#tour-file-commits",
		placement: "top",
		title: "Commit sentiment",
		description:
			"Every commit message in the window, scored as caution, neutral, or satisfaction by the sentiment model.",
	},
	{
		id: "drift",
		selector: "#tour-file-drift",
		placement: "top",
		title: "Risk drift",
		description:
			"Compares the first and second half of the commit history to show whether this file is trending toward or away from risk.",
	},
	{
		id: "shap",
		selector: "#tour-file-shap",
		placement: "top",
		title: "Why this score?",
		description:
			"The risk score broken into the individual signals that pushed it up or down, so nothing here is a black box.",
	},
	{
		id: "complexity",
		selector: "#tour-file-complexity",
		placement: "top",
		title: "Complexity metrics",
		description:
			"The raw structural numbers behind the complexity score, compared against the rest of the repo. Every metric on this page has an ⓘ — hover it for a plain-language definition.",
	},
];

function buildSteps(): TourStepDetails[] {
	const present = CANDIDATES.filter((c) => document.querySelector(c.selector));

	const intro: TourStepDetails = {
		id: "intro",
		type: "dialog",
		title: "Understanding this file",
		description: "A quick walkthrough of what each section on this page tells you.",
		actions: [
			{ label: "Skip", action: "dismiss" },
			{ label: "Next", action: "next" },
		],
	};

	const tooltipSteps: TourStepDetails[] = present.map((c, i) => ({
		id: c.id,
		type: "tooltip",
		target: () => document.querySelector<HTMLElement>(c.selector),
		placement: c.placement,
		title: c.title,
		description: c.description,
		actions:
			i === present.length - 1
				? [
						{ label: "Back", action: "prev" },
						{ label: "Done", action: "dismiss" },
					]
				: [
						{ label: "Back", action: "prev" },
						{ label: "Next", action: "next" },
					],
	}));

	return [intro, ...tooltipSteps];
}

export function FileAnalysisTour({ onDone }: { onDone: () => void }): JSX.Element | null {
	const [steps, setSteps] = useState<TourStepDetails[] | null>(null);

	useEffect(() => {
		setSteps(buildSteps());
	}, []);

	if (!steps) return null;
	return <GuidedTour steps={steps} onDone={onDone} />;
}
