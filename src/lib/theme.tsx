import { createContext, useContext, useEffect, useState, type JSX, type ReactNode } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "gomi:theme";

function getInitialTheme(): Theme {
	const stored = localStorage.getItem(THEME_KEY);
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
	const [theme, setTheme] = useState<Theme>(getInitialTheme);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		localStorage.setItem(THEME_KEY, theme);
	}, [theme]);

	function toggleTheme() {
		setTheme((t) => (t === "dark" ? "light" : "dark"));
	}

	return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
	return ctx;
}
