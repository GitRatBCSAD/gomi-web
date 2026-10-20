// Single source of truth for plain-language definitions of Gomi's technical
// terms. Consumed by <GlossaryHint> tooltips in the File Analysis view and by
// the /guide reference page. Keep definitions jargon-free — the audience is a
// non-specialist reading their own repo's risk report.

import { BELOW_GATE } from "./interpret";

export type GlossaryKey =
	| "risk-score"
	| "shap"
	| "base-rate"
	| "sentiment-score"
	| "caution-probability"
	| "sentiment-trajectory"
	| "drift-category"
	| "complexity-score"
	| "cyclomatic-complexity"
	| "nloc"
	| "change-entropy"
	| "ndev"
	| "age-score"
	| "low-info-ratio"
	| "n-commits";

export interface GlossaryEntry {
	/** Short human title shown at the top of the tooltip. */
	title: string;
	/** One or two plain-language sentences, no jargon. */
	definition: string;
	/** How to read the verbal label shown in the UI. Mirrors lib/interpret.ts. */
	reading: string;
	/** Authoritative external reference for "Learn more". */
	href: string;
}

export const GLOSSARY: Record<GlossaryKey, GlossaryEntry> = {
	"risk-score": {
		title: "Risk level",
		definition:
			"Gomi's estimate of how likely it is that this file's changes in the last 6 months introduced a bug. It blends how the code is built with how developers write about it.",
		reading:
			"Shown as Low, Moderate or High. High starts at the model's warning line; Low and Moderate split the files below it into the safer and riskier half of this repository.",
		href: "https://www.google.com/search?q=what+is+technical+debt",
	},
	shap: {
		title: "What drives the score (SHAP)",
		definition:
			"A way of splitting one prediction into each signal's share, so you can see how much every factor pushed the risk up or down.",
		reading:
			"Main reason: 40% or more of the total push. Contributing factor: 15–40%. Minor factor: under 15%.",
		href: "https://shap.readthedocs.io/en/latest/",
	},
	"base-rate": {
		title: "Typical starting point",
		definition:
			"The model's starting point for a typical file, before this file's own signals are added on top.",
		reading: "Files that end up below this starting point are labelled Low risk.",
		href: "https://www.google.com/search?q=what+is+base+rate+statistics",
	},
	"sentiment-score": {
		title: "Commit message tone",
		definition:
			"The average caution level across this file's commit messages. Higher means more cautionary, urgent or frustrated language over time.",
		reading:
			"Mostly cautious: half or more of the readable messages are labelled Caution. Often: a quarter or more. Occasionally: fewer.",
		href: "https://www.google.com/search?q=what+is+sentiment+analysis",
	},
	"caution-probability": {
		title: "Caution level",
		definition:
			"For a single commit message, how strongly it reads as cautionary, urgent or frustrated rather than upbeat.",
		reading:
			"Each message is labelled Caution, Neutral or Positive, whichever the model finds most likely.",
		href: "https://www.google.com/search?q=what+is+sentiment+analysis",
	},
	"sentiment-trajectory": {
		title: "Caution over time",
		definition:
			"A timeline of the caution level, commit by commit, so you can watch the mood around a file trend up or down over months.",
		reading:
			"Higher dots sound more cautious. A change of 10% or more between the older and newer half counts as a trend.",
		href: "https://www.google.com/search?q=what+is+exponential+moving+average",
	},
	"drift-category": {
		title: "Trend",
		definition:
			"A plain-language label for how a file's risk is trending, for example whether debt is piling up fast or a cleanup effort is working.",
		reading:
			"Based on sudden jumps in caution level and on whether tone or code structure drives the score.",
		href: "https://www.google.com/search?q=what+is+technical+debt",
	},
	"complexity-score": {
		title: "Overall complexity",
		definition:
			"How structurally heavy the file is, combining function length and branching, ranked against the rest of the repo.",
		reading:
			"Lower than most: bottom 25% of files. Typical: middle 50%. Higher than most: top 25%. Among the highest: top 10%.",
		href: "https://www.google.com/search?q=what+is+programming+complexity",
	},
	"cyclomatic-complexity": {
		title: "Cyclomatic complexity",
		definition:
			"A count of how many different paths run through a function. More paths means more branches to test and more places a bug can hide.",
		reading:
			"Simple: 1–10. Moderately complex: 11–20. Complex, hard to test: 21–50. Very complex, untestable: over 50.",
		href: "https://www.google.com/search?q=what+is+cyclomatic+complexity",
	},
	nloc: {
		title: "Function length",
		definition:
			"Average lines of code per function, ignoring blanks and comments. Longer functions are usually harder to read and change safely.",
		reading:
			"Compared with the other files in this repo using the same top-25% and top-10% cut-offs.",
		href: "https://www.google.com/search?q=what+is+source+lines+of+code",
	},
	"change-entropy": {
		title: "How scattered changes are",
		definition:
			"How scattered the edits are: whether changes to this file usually come with changes to many other files at once.",
		reading:
			"Compared with the other files in this repo using the same top-25% and top-10% cut-offs.",
		href: "https://www.google.com/search?q=what+is+entropy+information+theory",
	},
	ndev: {
		title: "Number of developers",
		definition:
			"How many different developers have edited this file. When ownership is spread thin, no one fully understands it.",
		reading:
			"Compared with the other files in this repo using the same top-25% and top-10% cut-offs.",
		href: "https://www.microsoft.com/en-us/research/publication/dont-touch-my-code-examining-the-effects-of-ownership-on-software-quality/",
	},
	"age-score": {
		title: "File age",
		definition:
			"How long this file has been actively changed: the time between its first and last change in the analysis window.",
		reading:
			"Higher than most means it has been worked on over a longer stretch than most files.",
		href: "https://www.google.com/search?q=what+is+software+rot",
	},
	"low-info-ratio": {
		title: "Commit message detail",
		definition:
			"The share of commit messages too short to read for tone (under 5 words), like 'fix' or 'wip'.",
		reading:
			"Mostly vague: half or more of the messages are too short. Some vague: a quarter or more.",
		href: "https://www.google.com/search?q=what+is+a+commit+version+control",
	},
	"n-commits": {
		title: "How active the file is",
		definition:
			"How often this file changed in the last 6 months. The model reads it on a log scale, so going from 1 to 5 changes counts more than going from 50 to 55.",
		reading: `Files with ${BELOW_GATE} in the last 6 months are marked Not enough history and get no score.`,
		href: "https://www.google.com/search?q=what+is+a+commit+version+control",
	},
};
