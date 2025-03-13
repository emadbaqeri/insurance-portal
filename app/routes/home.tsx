import {
	HydrationBoundary,
	QueryClient,
	dehydrate,
} from "@tanstack/react-query";
import { useLoaderData } from "react-router";
import { useTranslation } from "react-i18next";
import {
	useInsuranceForms,
	prefetchInsuranceForms,
} from "~/api/hooks/insurance";
import {
	Container,
	Title,
	Text,
	Loader,
	Alert,
	Stack,
	Card,
	Group,
} from "@mantine/core";
import { Link } from "react-router";
import { IconAlertCircle } from "@tabler/icons-react";

export function meta() {
	const { t } = useTranslation();
	return [
		{ title: t("home.meta.title") },
		{
			property: "og:title",
			content: t("home.meta.ogTitle"),
		},
		{
			name: "description",
			content: t("home.meta.description"),
		},
	];
}

export async function loader() {
	const queryClient = new QueryClient();

	try {
		await prefetchInsuranceForms(queryClient);

		return Response.json({
			dehydratedState: dehydrate(queryClient),
		});
	} catch (error) {
		console.error("Error prefetching insurance forms:", error);
		return Response.json({
			dehydratedState: dehydrate(queryClient),
			error: "Failed to load insurance forms",
		});
	}
}

export default function Home() {
	const { dehydratedState, error } = useLoaderData<typeof loader>();

	return (
		<HydrationBoundary state={dehydratedState}>
			<HomeContent serverError={error} />
		</HydrationBoundary>
	);
}

function HomeContent({ serverError }: { serverError?: string }) {
	const { t } = useTranslation();
	const { data, isLoading, isError, error } = useInsuranceForms();

	if (isLoading) {
		return (
			<Container size="md" py="xl" style={{ textAlign: "center" }}>
				<Loader size="lg" />
				<Text mt="md">{t("home.loading")}</Text>
			</Container>
		);
	}

	if (isError || serverError) {
		return (
			<Container size="md" py="xl">
				<Alert
					icon={<IconAlertCircle size={16} />}
					title={t("home.error.title")}
					color="red"
					variant="filled"
				>
					{serverError || error?.message}
				</Alert>
			</Container>
		);
	}

	if (!data?.length) {
		return (
			<Container size="md" py="xl">
				<Alert
					icon={<IconAlertCircle size={16} />}
					title={t("home.noData.title")}
					color="blue"
					variant="light"
				>
					{t("home.noData.message")}
				</Alert>
			</Container>
		);
	}

	return (
		<Container size="md" py="xl">
			<Title order={1} mb="lg">
				{t("home.availableForms")}
			</Title>
			<Stack>
				{data.map((form) => (
					<Card
						key={form.formId}
						padding="lg"
						radius="md"
						component={Link}
						to={`/forms/${form.formId}`}
						withBorder
					>
						<Group justify="space-between" mb="xs">
							<Text fw={500}>{form.title}</Text>
						</Group>

						<Text size="sm" c="dimmed">
							{t("home.clickToApply")}
						</Text>
					</Card>
				))}
			</Stack>
		</Container>
	);
}
