import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, type JSX } from "react";

interface Candidate {
	id: string;
	selector: string;
	side: "top" | "bottom" | "left" | "right";
	title: string;
	description: string;
}

const CANDIDATES: Candidate[] = [
	{
		id: "header",
		selector: "#tour-file-header",
		side: "bottom",
		title: "Your file's risk score",
		description:
			"A 0-to-1 estimate of how likely this file is to need a bug fix soon. It blends code structure with commit sentiment into one number.",
	},
	{
		id: "sentiment",
		selector: "#tour-file-sentiment",
		side: "top",
		title: "Sentiment trajectory",
		description:
			"How cautious commit messages sounded over time, with a smoothed trend line. Spikes mark moments worth a closer look.",
	},
	{
		id: "rootcause",
		selector: "#tour-file-rootcause",
		side: "top",
		title: "Root cause commit",
		description:
			"When risk spikes, Gomi finds the single commit most responsible and explains whether it was driven by sentiment or by structural change.",
	},
	{
		id: "commits",
		selector: "#tour-file-commits",
		side: "top",
		title: "Commit sentiment",
		description:
			"Every commit message in the window, scored as caution, neutral, or satisfaction by the sentiment model.",
	},
	{
		id: "drift",
		selector: "#tour-file-drift",
		side: "top",
		title: "Risk drift",
		description:
			"Compares the first and second half of the commit history to show whether this file is trending toward or away from risk.",
	},
	{
		id: "shap",
		selector: "#tour-file-shap",
		side: "top",
		title: "Why this score?",
		description:
			"The risk score broken into the individual signals that pushed it up or down, so nothing here is a black box.",
	},
	{
		id: "complexity",
		selector: "#tour-file-complexity",
		side: "top",
		title: "Complexity metrics",
		description:
			"The raw structural numbers behind the complexity score, compared against the rest of the repo. Every metric on this page has an ⓘ — hover it for a plain-language definition.",
	},
];

export function startFileAnalysisDriverTour(onDone?: () => void) {
	const present = CANDIDATES.filter((c) => document.querySelector(c.selector));

	const steps: DriveStep[] = [
		{
			popover: {
				title: "Understanding this file",
				description: "A quick walkthrough of what each section on this page tells you.",
			},
		},
		...present.map((c) => ({
			element: c.selector,
			popover: {
				title: c.title,
				description: c.description,
				side: c.side,
				align: "start" as const,
			},
		})),
	];

	const driverObj = driver({
		showProgress: true,
		animate: true,
		overlayColor: "rgba(0, 0, 0, 0.7)",
		stagePadding: 8,
		stageRadius: 10,
		onDestroyed: () => {
			onDone?.();
		},
		steps,
	});

	driverObj.drive();
}

export function FileAnalysisTour({ onDone }: { onDone: () => void }): JSX.Element | null {
	useEffect(() => {
		startFileAnalysisDriverTour(onDone);
	}, []);

	return null;
}
