import type { Route } from "../+types/root";
import { notifications } from "@mantine/notifications";
import { useLoaderData, useNavigate } from "react-router";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { Container, Title, Paper, Alert, Button, Group } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { insuranceKeys } from "~/api/hooks/insurance";
import { DynamicForm } from "~/components/dynamic-form";
import {
	prefetchInsuranceForms,
	useSubmitInsuranceForm,
} from "~/api/hooks/insurance";
import type {
	InsuranceFormListResponse,
	InsuranceForm,
} from "~/api/types/insurance";

type LoaderData = {
	form: InsuranceForm;
	error?: string;
	dehydratedState?: unknown;
};

export async function loader({ params }: Route.LoaderArgs) {
	const { formId } = params;

	if (!formId) {
		return Response.json({ error: "Form ID is required" }, { status: 400 });
	}

	const queryClient = new QueryClient();

	try {
		await prefetchInsuranceForms(queryClient);

		const forms = queryClient.getQueryData<InsuranceFormListResponse>(
			insuranceKeys.forms(),
		);

		if (!Array.isArray(forms)) {
			return Response.json(
				{
					error: "Failed to retrieve insurance forms",
					dehydratedState: dehydrate(queryClient),
				},
				{ status: 500 },
			);
		}

		const requestedForm = forms.find((form) => form.formId === formId);

		if (!requestedForm) {
			return Response.json(
				{
					error: `Form with ID '${formId}' not found`,
					dehydratedState: dehydrate(queryClient),
				},
				{ status: 404 },
			);
		}

		return Response.json({
			form: requestedForm,
			dehydratedState: dehydrate(queryClient),
		});
	} catch (error) {
		console.error("Error retrieving form:", error);
		return Response.json(
			{
				error: "An error occurred while retrieving the form",
				dehydratedState: dehydrate(queryClient),
			},
			{ status: 500 },
		);
	}
}

export default function InsuranceFormPage() {
	const { t } = useTranslation();
	const { form, error } = useLoaderData<LoaderData>();
	const { mutate: submitForm, isPending } = useSubmitInsuranceForm();
	const navigate = useNavigate();

	if (error) {
		return (
			<Container size="md" py="xl">
				<Button
					variant="light"
					leftSection={<IconArrowLeft size={14} />}
					mb="md"
					onClick={() => navigate(-1)}
				>
					{t("insuranceForm.back")}
				</Button>
				<Alert
					icon={<IconAlertCircle size={16} />}
					title={t("insuranceForm.error.title")}
					color="red"
					variant="filled"
				>
					{error}
				</Alert>
			</Container>
		);
	}

	return (
		<Container size="md" py="xl">
			<Group mb="lg">
				<Button
					variant="light"
					leftSection={<IconArrowLeft size={14} />}
					onClick={() => navigate(-1)}
				>
					{t("insuranceForm.back")}
				</Button>
				<Title order={1}>{form.title}</Title>
			</Group>
			<Paper shadow="sm" radius="md" p="lg" withBorder>
				<DynamicForm
					form={form}
					onSubmit={(formData) => {
						submitForm(
							{
								formId: form.formId,
								data: formData,
							},
							{
								onSuccess: () => {
									notifications.show({
										color: "green",
										title: t("insuranceForm.success.title"),
										message: t("insuranceForm.success.message"),
										icon: <IconCheck size={16} />,
										autoClose: 5000,
									});
								},
								onError: (error) => {
									notifications.show({
										title: t("insuranceForm.error.title"),
										message:
											error.message || t("insuranceForm.error.submitMessage"),
										color: "red",
										icon: <IconAlertCircle size={16} />,
										autoClose: 8000,
									});
								},
							},
						);
					}}
					isSubmitting={isPending}
				/>
			</Paper>
		</Container>
	);
}
