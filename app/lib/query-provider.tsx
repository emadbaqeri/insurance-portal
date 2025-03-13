import { useState, type ReactNode } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Props for the QueryProvider component
 */
interface QueryProviderProps {
	/** React children to be wrapped by the provider */
	children: ReactNode;
	/** Optional dehydrated state for hydrating server-rendered queries */
	dehydratedState?: unknown;
}

// 10 mins stale time for query cache
const STALE_TIME = 60 * 10000;

/**
 * Provides React Query context to the application
 *
 * Creates a QueryClient with SSR-friendly defaults and wraps children
 * with QueryClientProvider to enable React Query functionality.
 *
 * @param {QueryProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to be wrapped
 * @param {unknown} [props.dehydratedState] - Optional dehydrated state for SSR
 * @returns {JSX.Element} The provider component with children
 */
export function QueryProvider({ children }: QueryProviderProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// tweaked the defaults for being more SSR friendly
						refetchOnWindowFocus: false,
						refetchOnMount: false,
						retry: false,
						staleTime: STALE_TIME,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools />
		</QueryClientProvider>
	);
}
