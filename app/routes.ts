import {
	type RouteConfig,
	index,
	route,
	layout,
} from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("submissions", "routes/submissions.tsx"),
	route("/forms/:formId", "routes/insurance-form.tsx"),
] satisfies RouteConfig;
