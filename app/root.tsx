import "./app.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";

import "~/i18n/index";

import type { Route } from "./+types/root";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useLoaderData,
} from "react-router";
import {
	QueryClient,
	dehydrate,
	HydrationBoundary,
} from "@tanstack/react-query";
import {
	ColorSchemeScript,
	MantineProvider,
	mantineHtmlProps,
	type MantineColorScheme,
} from "@mantine/core";

import { QueryProvider } from "~/lib/query-provider";
import { useLocalStorage } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";
import { AppShellLayout } from "~/layouts/app-shell";
import { NavigationProgressBar } from "~/components/navigation-progress-bar";

export async function loader() {
	const queryClient = new QueryClient();
	// prefetch global data (like application settings) here
	// await queryClient.prefetchQuery(['globalData'], fetchGlobalData);

	return {
		dehydratedState: dehydrate(queryClient),
	};
}

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	const [colorscheme, _] = useLocalStorage({
		key: "mantine-color-scheme-value",
		defaultValue: "dark",
	});

	const { dehydratedState } = useLoaderData<typeof loader>();
	return (
		<html lang="en" {...mantineHtmlProps}>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<ColorSchemeScript
					defaultColorScheme={colorscheme as MantineColorScheme}
				/>
				<Meta />
				<Links />
			</head>
			<body>
				<QueryProvider>
					<HydrationBoundary state={dehydratedState}>
						<MantineProvider
							defaultColorScheme={colorscheme as MantineColorScheme}
						>
							<NavigationProgressBar />
							<Notifications />
							<AppShellLayout>{children}</AppShellLayout>
						</MantineProvider>
					</HydrationBoundary>
				</QueryProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
