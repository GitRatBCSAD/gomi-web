import { driver, type DriveStep } from "driver.js";

import "driver.js/dist/driver.css";
import { useEffect, type JSX } from "react";

export function startRepoDriverTour(onDone?: () => void) {
	const steps: DriveStep[] = [
		{
			popover: {
				title: "Repository Risk Overview",
				description:
					"This page shows which files in this repository most likely had bugs introduced by their recent changes, based on how the code is built and how developers describe their changes.",
			},
		},
		{
			element: "#tour-repo-header",
			popover: {
				title: "Header & Reanalyze",
				description:
					"View repository visibility status and trigger a reanalysis whenever major commits are pushed.",
				side: "bottom",
				align: "start",
			},
		},
		{
			element: "#tour-repo-summary",
			popover: {
				title: "Summary",
				description:
					"The sentence on top tells you how many files need attention. Click a card (Needs attention, OK for now, Not enough history) to filter the map.",
				side: "bottom",
				align: "start",
			},
		},
		{
			element: "#tour-repo-heatmap",
			popover: {
				title: "Interactive File Heatmap",
				description:
					"Each tile is a file. Color shows its risk level: red Very High, orange High, yellow Moderate, green Low, gray not enough history. Hover a tile for a summary.",
				side: "top",
				align: "start",
			},
		},
		{
			popover: {
				title: "File Deep-Dive",
				description:
					"Click any tile to see why the file got its level, what to do about it, and how it is trending.",
			},
		},
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

export function RepoDriverTour({ onDone }: { onDone: () => void }): JSX.Element | null {
	useEffect(() => {
		startRepoDriverTour(onDone);
	}, []);

	return null;
}
