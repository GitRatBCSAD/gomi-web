import type { JSX } from "react/jsx-runtime";

export function Navbar(): JSX.Element {
	return (
		<nav className="bg-dark-500 border-b-primary fixed inset-0 z-999 flex h-18 items-center border p-4">
			Gomi
		</nav>
	);
}
