import {
	TextInput,
	NumberInput,
	Select,
	Checkbox,
	Radio,
	Group,
	Button,
	Stack,
	Paper,
	Title,
	Text,
	Box,
	Alert,
	Loader,
	LoadingOverlay,
} from "@mantine/core";
import {
	useForm,
	useWatch,
	Controller,
	type Control,
	type FieldValues,
	type FieldErrors,
	type FieldError,
} from "react-hook-form";
import { match, P } from "ts-pattern";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactElement } from "react";
import { IconAlertCircle, IconGripVertical } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type {
	FormField,
	InputFormField,
	InsuranceForm,
	OptionFormField,
	VisibilityCondition,
} from "~/api/types/insurance";
import { getApiClient } from "~/api/client";

interface DynamicFormProps {
	form: InsuranceForm;
	onSubmit: (data: Record<string, unknown>) => void;
	isSubmitting?: boolean;
	onFieldsReordered?: (reorderedFields: FormField[]) => void;
}

const getFormStorageKey = (formId: string) => `form_data_${formId}`;
const DEBOUNCE_DELAY = 1000;

export function DynamicForm({
	form,
	onSubmit,
	isSubmitting = false,
	onFieldsReordered,
}: DynamicFormProps) {
	const { t } = useTranslation();
	const storageKey = getFormStorageKey(form.formId);
	const [fields, setFields] = useState<FormField[]>(form.fields);

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
		reset,
		watch,
		trigger,
	} = useForm({
		defaultValues: loadFormData(storageKey) || {},
		mode: "onChange",
	});

	const formValues = watch();

	// Debounced autosave
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (isDirty) {
				saveFormData(storageKey, formValues);
			}
		}, DEBOUNCE_DELAY);

		return () => clearTimeout(timeoutId);
	}, [formValues, isDirty, storageKey]);

	// Save on window close
	useEffect(() => {
		const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
			if (isDirty) saveFormData(storageKey, formValues);
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [isDirty, formValues, storageKey]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = fields.findIndex((field) => field.id === active.id);
			const newIndex = fields.findIndex((field) => field.id === over.id);

			const newFields = [...fields];
			const [movedField] = newFields.splice(oldIndex, 1);
			newFields.splice(newIndex, 0, movedField);

			setFields(newFields);
			if (onFieldsReordered) onFieldsReordered(newFields);
		}
	};

	const handleFormSubmit = async (data: Record<string, unknown>) => {
		const isFormValid = await trigger();
		if (!isFormValid) return;

		try {
			await onSubmit(data);
			const emptyValues = getAllFieldIds(fields).reduce(
				(acc, id) => {
					acc[id] = undefined;
					return acc;
				},
				{} as Record<string, unknown>,
			);
			reset(emptyValues);
			clearFormData(storageKey);
		} catch (error) {
			console.error("Submission error:", error);
		}
	};

	const handleClearForm = () => {
		const emptyValues = getAllFieldIds(fields).reduce(
			(acc, id) => {
				acc[id] = undefined;
				return acc;
			},
			{} as Record<string, unknown>,
		);
		reset(emptyValues);
		clearFormData(storageKey);
	};

	return (
		<Box
			component="form"
			onSubmit={handleSubmit(handleFormSubmit)}
			mb="lg"
			pos="relative"
		>
			<LoadingOverlay
				visible={isSubmitting}
				zIndex={1000}
				overlayProps={{ radius: "sm", blur: 2 }}
			/>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={fields.map((field) => field.id)}
					strategy={verticalListSortingStrategy}
				>
					<Stack>
						{fields.map((field) => (
							<SortableFormField
								key={field.id}
								field={field}
								control={control}
								errors={errors}
							/>
						))}
					</Stack>
				</SortableContext>
			</DndContext>

			<Group mt="xl">
				<Button
					type="submit"
					loading={isSubmitting}
					disabled={isSubmitting}
					color="blue"
				>
					{isSubmitting
						? t("dynamicForm.submitting")
						: t("dynamicForm.submitForm")}
				</Button>
				<Button
					variant="outline"
					color="gray"
					onClick={handleClearForm}
					disabled={isSubmitting}
				>
					{t("dynamicForm.clearForm")}
				</Button>
			</Group>

			{Object.keys(errors).length > 0 && (
				<Alert
					icon={<IconAlertCircle size={16} />}
					title={t("dynamicForm.error.title")}
					color="red"
					mt="md"
				>
					{t("dynamicForm.error.fixErrors")}
				</Alert>
			)}

			{isDirty && (
				<Text size="xs" color="dimmed" mt="xs">
					{t("dynamicForm.draftSaved")}
				</Text>
			)}
		</Box>
	);
}

// Rest of the helper functions remain unchanged

function getAllFieldIds(fields: FormField[]): string[] {
	let ids: string[] = [];

	for (const field of fields) {
		ids.push(field.id);

		if (field.type === "group" && field.fields) {
			ids = [...ids, ...getAllFieldIds(field.fields)];
		}
	}

	return ids;
}

function saveFormData(key: string, data: Record<string, unknown>): void {
	try {
		if (typeof window !== "undefined") {
			localStorage.setItem(key, JSON.stringify(data));
		}
	} catch (error) {
		console.error("Error saving form data:", error);
	}
}

function loadFormData(key: string): Record<string, unknown> | null {
	try {
		if (typeof window !== "undefined") {
			const data = localStorage.getItem(key);
			return data ? JSON.parse(data) : null;
		}
		return null;
	} catch (error) {
		console.error("Error loading form data:", error);
		return null;
	}
}

function clearFormData(key: string): void {
	try {
		if (typeof window !== "undefined") {
			localStorage.removeItem(key);
		}
	} catch (error) {
		console.error("Error clearing form data:", error);
	}
}

// Sortable wrapper component for form fields
function SortableFormField({
	field,
	control,
	errors,
}: {
	field: FormField;
	control: Control<FieldValues>;
	errors: FieldErrors<Record<string, unknown>>;
}) {
	const dependsOn = field.visibility?.dependsOn ?? "";
	const watchValue = useWatch({ control, name: dependsOn });

	// Check visibility condition
	if (field.visibility) {
		const isVisible = checkVisibility(field.visibility, watchValue);
		if (!isVisible) return null;
	}

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: field.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		position: "relative" as const,
		zIndex: isDragging ? 1 : "auto",
	};

	return (
		<Box ref={setNodeRef} style={style}>
			<Paper p="md" withBorder>
				<Group mb="xs">
					<Box
						{...attributes}
						{...listeners}
						style={{
							cursor: "grab",
							display: "flex",

							alignItems: "center",
							padding: "4px",
							"&:hover": { backgroundColor: "#f1f1f1" },
							borderRadius: "4px",
						}}
					>
						<IconGripVertical size={16} />
					</Box>

					{field.type === "group" && (
						<Title order={4} style={{ flex: 1 }}>
							{field.label}
						</Title>
					)}
				</Group>

				{renderFormField(field, control, errors)}
			</Paper>
		</Box>
	);
}

function renderFormField(
	field: FormField,
	control: Control<FieldValues>,
	errors: FieldErrors<Record<string, unknown>>,
): ReactElement | null {
	return match(field)
		.with({ type: "group" }, (groupField) => (
			<Stack>
				{groupField.fields.map((subField: FormField) => (
					<FormFieldComponent
						key={subField.id}
						field={subField}
						control={control}
						errors={errors}
					/>
				))}
			</Stack>
		))
		.with({ type: P.union("select", "radio", "checkbox") }, (optionField) => (
			<OptionField
				field={optionField as OptionFormField}
				control={control}
				errors={errors}
			/>
		))
		.with({ type: P.union("text", "number", "date") }, (inputField) => (
			<InputField
				field={inputField as InputFormField}
				control={control}
				errors={errors}
			/>
		))
		.otherwise(() => null);
}

// Original FormFieldComponent (non-sortable)
function FormFieldComponent({
	field,
	control,
	errors,
}: {
	field: FormField;
	control: Control<FieldValues>;
	errors: FieldErrors<Record<string, unknown>>;
}): ReactElement | null {
	const dependsOn = field.visibility?.dependsOn ?? "";
	const watchValue = useWatch({ control, name: dependsOn });

	// Check visibility condition
	if (field.visibility) {
		const isVisible = checkVisibility(field.visibility, watchValue);
		if (!isVisible) return null;
	}

	return renderFormField(field, control, errors);
}

function InputField({
	field,
	control,
	errors,
}: {
	field: InputFormField;
	control: Control<FieldValues>;
	errors: FieldErrors<Record<string, unknown>>;
}): ReactElement {
	const { t } = useTranslation();
	const errorMessage = errors[field.id]
		? getErrorMessage(errors[field.id] as FieldError, field, t)
		: undefined;

	return (
		<Controller
			name={field.id}
			control={control}
			rules={getValidationRules(field)}
			render={({ field: { onChange, value, onBlur } }) =>
				match(field.type)
					.with("date", () => (
						<DateInput
							id={field.id}
							label={field.label}
							description={t("dynamicForm.input.description")}
							placeholder={t("dynamicForm.input.placeholder")}
							required={field.required}
							withAsterisk={field.required}
							value={value ? new Date(value) : null}
							onChange={(date) => onChange(date)}
							onBlur={onBlur}
							error={errorMessage}
						/>
					))
					.with("number", () => (
						<NumberInput
							id={field.id}
							label={field.label}
							placeholder={t("dynamicForm.input.enterNumber")}
							required={field.required}
							withAsterisk={field.required}
							value={value || ""}
							onChange={(val) => onChange(val)}
							onBlur={onBlur}
							error={errorMessage}
							min={field.validation?.min}
							max={field.validation?.max}
						/>
					))
					.otherwise(() => (
						<TextInput
							id={field.id}
							type={field.type}
							label={field.label}
							placeholder={t("dynamicForm.input.enterField", {
								field: field.label.toLowerCase(),
							})}
							required={field.required}
							withAsterisk={field.required}
							value={value || ""}
							onChange={onChange}
							onBlur={onBlur}
							error={errorMessage}
						/>
					))
			}
		/>
	);
}

function OptionField({
	field,
	control,
	errors,
}: {
	field: OptionFormField;
	control: Control<FieldValues>;
	errors: FieldErrors<Record<string, unknown>>;
}): ReactElement {
	const { t } = useTranslation();
	const { data: dynamicOptions, isLoading } = useDynamicOptions(field, control);
	const options = dynamicOptions || field.options || [];

	const errorMessage = errors[field.id]
		? field.required && errors[field.id]?.type === "required"
			? t("dynamicForm.validation.required")
			: t("dynamicForm.validation.invalidSelection")
		: undefined;

	return (
		<Controller
			name={field.id}
			control={control}
			rules={{ required: field.required }}
			render={({ field: { onChange, value, onBlur } }) =>
				match(field.type)
					.with("select", () => {
						const selectOptions = Array.isArray(options)
							? options.map((option: string) => ({
									value: option,
									label: option,
								}))
							: [];

						return (
							<Select
								id={field.id}
								label={field.label}
								placeholder={t("dynamicForm.select.placeholder")}
								required={field.required}
								withAsterisk={field.required}
								data={selectOptions}
								value={value || null}
								onChange={onChange}
								onBlur={onBlur}
								error={errorMessage}
								disabled={isLoading && field.dynamicOptions !== undefined}
								rightSection={
									isLoading && field.dynamicOptions ? (
										<Loader size="xs" />
									) : null
								}
							/>
						);
					})
					.with("radio", () => (
						<Radio.Group
							id={field.id}
							label={field.label}
							required={field.required}
							withAsterisk={field.required}
							value={value || ""}
							onChange={onChange}
							onBlur={onBlur}
							error={errorMessage}
						>
							<Group mt="xs">
								{Array.isArray(options) &&
									options.map((option: string) => (
										<Radio key={option} value={option} label={option} />
									))}
							</Group>
						</Radio.Group>
					))
					.with("checkbox", () => (
						<Box>
							<Text size="sm" mb="xs">
								{field.label}
								{field.required && (
									<span style={{ color: "red", marginLeft: 4 }}>*</span>
								)}
							</Text>
							{isLoading && field.dynamicOptions && (
								<Group mb="xs">
									<Loader size="xs" />
									<Text size="xs" color="dimmed">
										{t("dynamicForm.loading")}
									</Text>
								</Group>
							)}
							<Stack>
								{Array.isArray(options) &&
									options.map((option: string) => (
										<Checkbox
											key={option}
											label={option}
											checked={value?.includes(option)}
											onChange={(e) => {
												const newValue = e.currentTarget.checked
													? [...(value || []), option]
													: (value || []).filter((v: string) => v !== option);
												onChange(newValue);
											}}
											onBlur={onBlur}
										/>
									))}
							</Stack>
							{errorMessage && (
								<Text style={{ color: "red" }} size="xs" mt="xs">
									{errorMessage}
								</Text>
							)}
						</Box>
					))
					.otherwise(() => (
						<Text style={{ color: "red" }}>
							{t("dynamicForm.unknownFieldType", { type: field.type })}
						</Text>
					))
			}
		/>
	);
}

function useDynamicOptions(
	field: OptionFormField,
	control: Control<FieldValues>,
) {
	const dependsOnValue = useWatch({
		control,
		name: field.dynamicOptions?.dependsOn ?? "",
	});
	const client = getApiClient();

	const queryParams = new URLSearchParams();
	queryParams.append(field.dynamicOptions?.dependsOn ?? "USA", dependsOnValue);
	const queryString = queryParams.toString();

	const endpoint = match(field.dynamicOptions?.endpoint)
		.with(P.string.startsWith("/"), (ep) => ep.slice(1))
		.otherwise((ep) => ep);

	return useQuery({
		queryKey: [field.dynamicOptions?.dependsOn, dependsOnValue],
		queryFn: async () => {
			return match(field)
				.with({ dynamicOptions: P.not(P.nullish) }, async () => {
					const response = await client
						.get<{ country: string; states: Array<string> }>(
							`${endpoint}?${queryString}`,
						)
						.json();
					return response.states;
				})
				.otherwise(() => field.options);
		},
		enabled: !!dependsOnValue,
	});
}

function checkVisibility(
	condition: VisibilityCondition,
	value: unknown,
): boolean {
	return match(condition.condition)
		.with("equals", () => value === condition.value)
		.with("notEquals", () => value !== condition.value)
		.with("contains", () => String(value).includes(String(condition.value)))
		.with("greaterThan", () => Number(value) > Number(condition.value))
		.with("lessThan", () => Number(value) < Number(condition.value))
		.otherwise(() => true);
}

function getValidationRules(field: InputFormField) {
	const rules: Record<string, unknown> = { required: field.required };

	if (field.validation) {
		if (field.validation.min !== undefined) rules.min = field.validation.min;
		if (field.validation.max !== undefined) rules.max = field.validation.max;
		if (field.validation.pattern)
			rules.pattern = new RegExp(field.validation.pattern);
	}

	return rules;
}

function getErrorMessage(
	error: Record<string, unknown>,
	field: InputFormField,
	t: (key: string, options?: Record<string, unknown>) => string,
) {
	return match(error.type)
		.with("required", () => t("dynamicForm.validation.required"))
		.with("min", () =>
			t("dynamicForm.validation.min", { value: field.validation?.min }),
		)
		.with("max", () =>
			t("dynamicForm.validation.max", { value: field.validation?.max }),
		)
		.with("pattern", () => t("dynamicForm.validation.pattern"))
		.otherwise(() => t("dynamicForm.validation.invalid"));
}
