import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
	InsuranceFormListResponse,
	InsuranceSubmissionDetail,
	InsuranceFormSubmitRequest,
	InsuranceSubmissionsResponse,
} from "~/api/types/insurance";
import { getApiClient } from "~/api/client";
import { ENDPOINTS } from "~/api/endpoints";

/**
 * Query keys for insurance-related queries
 */
export const insuranceKeys = {
	/** Base key for all insurance queries */
	all: ["insurance"] as const,
	/** Key for insurance forms queries */
	forms: () => [...insuranceKeys.all, "forms"] as const,
	/** Key for insurance submissions queries */
	submissions: () => [...insuranceKeys.all, "submissions"] as const,
} as const;

/**
 * Hook to fetch available insurance forms
 *
 * @returns {Object} Query result containing insurance forms data
 * @returns {InsuranceFormListResponse} returns.data - The insurance forms data when successful
 * @returns {boolean} returns.isLoading - Whether the query is in loading state
 * @returns {Error|null} returns.error - Error object if the query failed
 */
export function useInsuranceForms() {
	return useQuery({
		queryKey: insuranceKeys.forms(),
		queryFn: async () => {
			const client = getApiClient();
			return client
				.get(ENDPOINTS.INSURANCE.FORMS.BASE)
				.json<InsuranceFormListResponse>();
		},
	});
}

/**
 * Hook to submit an insurance form
 *
 * @returns {Object} Mutation object for submitting insurance forms
 * @returns {Function} returns.mutate - Function to trigger the form submission
 * @returns {boolean} returns.isLoading - Whether the mutation is in progress
 * @returns {Error|null} returns.error - Error object if the mutation failed
 * @returns {InsuranceSubmissionDetail|undefined} returns.data - The submission result data
 */
export function useSubmitInsuranceForm() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (formData: InsuranceFormSubmitRequest) => {
			const client = getApiClient();
			return client
				.post(ENDPOINTS.INSURANCE.FORMS.SUBMIT, {
					json: formData,
				})
				.json<InsuranceSubmissionDetail>();
		},
		onSuccess: () => {
			// Invalidate submissions query to refresh the list after a new submission
			queryClient.invalidateQueries({ queryKey: insuranceKeys.submissions() });
		},
	});
}

/**
 * Hook to fetch insurance form submissions with optional filtering
 *
 * @returns {Object} Query result containing insurance submissions data
 * @returns {InsuranceSubmissionsResponse} returns.data - The submissions data when successful
 * @returns {boolean} returns.isLoading - Whether the query is in loading state
 * @returns {Error|null} returns.error - Error object if the query failed
 */
export function useInsuranceFormSubmissions() {
	return useQuery({
		queryKey: insuranceKeys.submissions(),
		queryFn: async () => {
			const client = getApiClient();
			return client
				.get(ENDPOINTS.INSURANCE.FORMS.SUBMISSIONS)
				.json<InsuranceSubmissionsResponse>();
		},
	});
}

/**
 * Server function to prefetch insurance forms (for SSR)
 *
 * @param {QueryClient} queryClient - The React Query client instance
 * @returns {Promise<InsuranceFormListResponse>} The prefetched insurance forms data
 * @throws {Error} If the prefetch operation fails
 */
export async function prefetchInsuranceForms(queryClient: QueryClient) {
	const client = getApiClient();

	try {
		const data = await client
			.get(ENDPOINTS.INSURANCE.FORMS.BASE)
			.json<InsuranceFormListResponse>();

		queryClient.setQueryData(insuranceKeys.forms(), data);

		return data;
	} catch (error) {
		console.error("Error prefetching insurance forms:", error);
		throw error;
	}
}

/**
 * Server function to prefetch insurance form submissions (for SSR)
 *
 * @param {QueryClient} queryClient - The React Query client instance
 * @returns {Promise<InsuranceSubmissionsResponse>} The prefetched submissions data
 * @throws {Error} If the prefetch operation fails
 */
export async function prefetchInsuranceFormSubmissions(
	queryClient: QueryClient,
) {
	const client = getApiClient();

	try {
		const data = await client
			.get(ENDPOINTS.INSURANCE.FORMS.SUBMISSIONS)
			.json<InsuranceSubmissionsResponse>();

		queryClient.setQueryData(insuranceKeys.submissions(), data);

		return data;
	} catch (error) {
		console.error("Error prefetching insurance form submissions:", error);
		throw error;
	}
}
