import ky from "ky";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Base Ky instance with common configuration
 */
const baseKy = ky.create({
	prefixUrl: API_URL,
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * Browser-specific API client that automatically adds auth token from localStorage
 */
const browserClient = baseKy.extend({
	hooks: {
		beforeRequest: [
			(request) => {
				// Only attempt to get token if localStorage is available
				if (typeof localStorage !== "undefined") {
					const token = localStorage.getItem("authToken");
					if (token) {
						request.headers.set("Authorization", `Bearer ${token}`);
					}
				}
			},
		],
	},
});

/**
 * Server-specific API client without browser-specific features
 */
const serverClient = baseKy.extend({});

/**
 * Returns the appropriate API client based on execution environment
 *
 * @param {string} [serverToken] - Optional auth token to use for server-side requests
 * @returns {import('ky').KyInstance} Configured Ky instance for API requests
 */
export function getApiClient(serverToken?: string) {
	const isServerSide = typeof window === "undefined";

	if (isServerSide || serverToken) {
		return serverToken
			? serverClient.extend({
					hooks: {
						beforeRequest: [
							(request) => {
								request.headers.set("Authorization", `Bearer ${serverToken}`);
							},
						],
					},
				})
			: serverClient;
	}

	return browserClient;
}

// if needed for direct access
export const apiClient = browserClient;
export const serverApiClient = serverClient;
