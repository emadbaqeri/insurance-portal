import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const isProd = mode === "production";

	return {
		server: { port: 3000 },
		build: {
			sourcemap: !isProd,
		},
		plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
	};
});
