import { useQuery } from "@tanstack/react-query";

import { getApiClient } from "~/api/client";
import { ENDPOINTS } from "~/api/endpoints";

/**
 * Hook to fetch states/provinces for a given country
 *
 * @param {string} country - The country code to fetch states for
 * @returns {Object} Query result containing states data
 * @returns {string[]} returns.data - Array of state names when successful
 * @returns {boolean} returns.isLoading - Whether the query is in loading state
 * @returns {Error|null} returns.error - Error object if the query failed
 * @returns {boolean} returns.isEnabled - Whether the query is enabled (true if country is provided)
 */
export function useStates(country: string) {
	return useQuery({
		queryKey: ["states", country],
		queryFn: async () => {
			const client = getApiClient();
			return client
				.get(`${ENDPOINTS.GET_STATES}?country=${country}`)
				.json<string[]>();
		},
		enabled: Boolean(country),
	});
}
