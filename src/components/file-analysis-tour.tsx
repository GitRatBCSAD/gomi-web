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
		title: "Your file's risk level",
		description:
			"Low, Moderate, High or Very High: how likely it is that this file's recent changes introduced a bug, with a one-line reason and what to do next. Hover the label to see the exact score.",
	},
	{
		id: "sentiment",
		selector: "#tour-file-sentiment",
		side: "top",
		title: "Worry over time",
		description:
			"Whether commit messages are getting more worried, calmer, or holding steady, with the chart that shows it. Red dots sit above the worried line; the circled dot marks the biggest jump.",
	},
	{
		id: "rootcause",
		selector: "#tour-file-rootcause",
		side: "top",
		title: "Where the worry started",
		description:
			"When worry jumps, Gomi points to the change where it started and says whether tone or code structure drives the risk.",
	},
	{
		id: "commits",
		selector: "#tour-file-commits",
		side: "top",
		title: "Tone of commit messages",
		description:
			"Every commit message from the last 6 months, labelled Worried, Neutral or Positive.",
	},
	{
		id: "shap",
		selector: "#tour-file-shap",
		side: "top",
		title: "What drives this score",
		description:
			"Each factor is marked as the main reason, a contributing factor, or a minor factor, and whether it raises or lowers risk.",
	},
	{
		id: "complexity",
		selector: "#tour-file-complexity",
		side: "top",
		title: "Code structure and change history",
		description:
			"How this file compares with the rest of the repo, in words. Every item has an ⓘ: hover it to see what it means and how to read it.",
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
