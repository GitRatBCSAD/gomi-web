// Single source of truth for plain-language definitions of Gomi's technical
// terms. Consumed by <GlossaryHint> tooltips in the File Analysis view and by
// the /guide reference page. Keep definitions jargon-free — the audience is a
// non-specialist reading their own repo's risk report.

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
	/** Authoritative external reference for "Learn more". */
	href: string;
}

export const GLOSSARY: Record<GlossaryKey, GlossaryEntry> = {
	"risk-score": {
		title: "Risk score",
		definition:
			"Gomi's overall estimate, from 0 to 1, that this file will need a bug fix soon. It blends how the code is built with how developers write about it.",
		href: "https://en.wikipedia.org/wiki/Technical_debt",
	},
	shap: {
		title: "SHAP score",
		definition:
			"A way of splitting one prediction into each signal's share, so you can see exactly how much every factor pushed the risk score up or down.",
		href: "https://shap.readthedocs.io/en/latest/",
	},
	"base-rate": {
		title: "Base rate",
		definition:
			"The starting point of the score — the average risk across the whole repository, before this file's own signals are added on top.",
		href: "https://en.wikipedia.org/wiki/Base_rate",
	},
	"sentiment-score": {
		title: "Sentiment score",
		definition:
			"The average caution level across all of this file's commit messages. Higher means more worried or frustrated language over time.",
		href: "https://en.wikipedia.org/wiki/Sentiment_analysis",
	},
	"caution-probability": {
		title: "Caution probability",
		definition:
			"For a single commit message, how strongly it reads as worried, frustrated, or cautious rather than upbeat — scored from 0 to 1.",
		href: "https://en.wikipedia.org/wiki/Sentiment_analysis",
	},
	"sentiment-trajectory": {
		title: "Sentiment trajectory",
		definition:
			"A timeline of that caution level, commit by commit, so you can watch the mood around a file trend up or down over months.",
		href: "https://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average",
	},
	"drift-category": {
		title: "Drift category",
		definition:
			"A plain-language label for how a file's risk is trending — for example whether debt is piling up fast or a cleanup effort is working.",
		href: "https://en.wikipedia.org/wiki/Technical_debt",
	},
	"complexity-score": {
		title: "Complexity score",
		definition:
			"A single 0-to-1 rating of how structurally heavy the file is, combining function length and branching, ranked against the rest of the repo.",
		href: "https://en.wikipedia.org/wiki/Programming_complexity",
	},
	"cyclomatic-complexity": {
		title: "Cyclomatic complexity",
		definition:
			"A count of how many different paths run through a function. More paths means more branches to test and more places a bug can hide.",
		href: "https://en.wikipedia.org/wiki/Cyclomatic_complexity",
	},
	nloc: {
		title: "NLOC",
		definition:
			"Average lines of code per function, ignoring blanks and comments. Longer functions are usually harder to read and change safely.",
		href: "https://en.wikipedia.org/wiki/Source_lines_of_code",
	},
	"change-entropy": {
		title: "Change entropy",
		definition:
			"How scattered the edits to a file are. When lots of small changes touch many different parts, the file is churning in a messy, risky way.",
		href: "https://en.wikipedia.org/wiki/Entropy_(information_theory)",
	},
	ndev: {
		title: "NDev",
		definition:
			"How many different developers have edited this file. When ownership is spread thin across many people, no one fully understands it.",
		href: "https://www.microsoft.com/en-us/research/publication/dont-touch-my-code-examining-the-effects-of-ownership-on-software-quality/",
	},
	"age-score": {
		title: "Age score",
		definition:
			"How recently the file was last changed, ranked against the repo. Code left untouched for a long time can quietly rot as everything around it moves on.",
		href: "https://en.wikipedia.org/wiki/Software_rot",
	},
	"low-info-ratio": {
		title: "Low information ratio",
		definition:
			"The share of commit messages too short to read for sentiment, like 'fix' or 'wip'. A high share means little is explained about the changes.",
		href: "https://en.wikipedia.org/wiki/Commit_(version_control)",
	},
	"n-commits": {
		title: "Number of commits",
		definition:
			"How many times this file changed in the analysis window. Very active files carry more risk; too few, and the score is flagged as unreliable.",
		href: "https://en.wikipedia.org/wiki/Commit_(version_control)",
	},
};
