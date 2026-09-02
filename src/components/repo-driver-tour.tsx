import { driver, type DriveStep } from "driver.js";

import "driver.js/dist/driver.css";
import { useEffect, type JSX } from "react";

export function startRepoDriverTour(onDone?: () => void) {
	const steps: DriveStep[] = [
		{
			popover: {
				title: "Repository Risk Overview",
				description:
					"Welcome to the repository analysis view. Gomi combines static code complexity with commit message sentiment to calculate file risk.",
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
				title: "Risk Distribution Cards",
				description:
					"Filter files instantly by clicking Risky, Acceptable, or Low Confidence count cards.",
				side: "bottom",
				align: "start",
			},
		},
		{
			element: "#tour-repo-heatmap",
			popover: {
				title: "Interactive File Heatmap",
				description:
					"Tile size represents code complexity; color represents risk score. Use search or sort controls to find specific files.",
				side: "top",
				align: "start",
			},
		},
		{
			popover: {
				title: "File Deep-Dive",
				description:
					"Click any tile on the heatmap to open the file's deep-dive view—featuring Risk Drift, SHAP breakdowns, and Root Cause metrics.",
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
