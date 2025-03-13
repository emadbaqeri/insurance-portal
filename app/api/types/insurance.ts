/**
 * Represents the structure of an insurance form field validation rules
 */
export interface FieldValidation {
	required?: boolean;
	min?: number;
	max?: number;
	pattern?: string;
}

/**
 * Defines the dynamic options configuration for fields that depend on other fields
 */
export interface DynamicOptionsConfig {
	dependsOn: string;
	endpoint: string;
	method: string;
}

/**
 * Defines visibility conditions for conditional fields
 */
export interface VisibilityCondition {
	dependsOn: string;
	condition: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
	value: string | number | boolean;
}

/**
 * Base interface for form fields
 */
export interface BaseFormField {
	id: string;
	label: string;
	type: string;
	required: boolean;
	visibility?: VisibilityCondition;
}

/**
 * Interface for input fields (text, number, date)
 */
export interface InputFormField extends BaseFormField {
	type: "text" | "number" | "date";
	validation?: FieldValidation;
}

/**
 * Interface for option fields (select, radio, checkbox)
 */
export interface OptionFormField extends BaseFormField {
	type: "select" | "radio" | "checkbox";
	options: Array<string>;
	dynamicOptions?: DynamicOptionsConfig;
}

/**
 * Interface for group fields that contain nested fields
 */
export interface GroupFormField extends BaseFormField {
	type: "group";
	fields: Array<FormField>;
}

/**
 * Union type for all possible field types
 */
export type FormField = InputFormField | OptionFormField | GroupFormField;

/**
 * Interface representing a complete insurance form
 */
export interface InsuranceForm {
	formId: string;
	title: string;
	fields: Array<FormField>;
}

/**
 * Type for the response from the /api/insurance/forms endpoint
 */
export type InsuranceFormListResponse = Array<InsuranceForm>;

/**
 * Generic submission data structure with id and dynamic columns
 */
export interface InsuranceSubmissionData {
	id: string;
	[key: string]: string | number | boolean | null | undefined;
}

/**
 * Response structure from /api/insurance/forms/submissions endpoint
 */
export interface InsuranceSubmissionsResponse {
	columns: string[];
	data: InsuranceSubmissionData[];
}

/**
 * Type for a single submission entry from the submissions list
 */
export interface InsuranceSubmissionEntry {
	id: string;
	"Full Name": string;
	Age: number;
	Gender: string;
	"Insurance Type": string;
	City: string;
	attachmentUrls?: string[];
	[key: string]:
		| string
		| number
		| boolean
		| null
		| undefined
		| string[]
		| Record<string, unknown>; // For any additional fields
}

/**
 * Response structure for a single submission detail
 */
export interface InsuranceSubmissionDetail
	extends Omit<
		InsuranceSubmissionEntry,
		"attachmentUrls" | "additionalDetails"
	> {
	formId: string;
	userId: string;
	status: "pending" | "approved" | "rejected";
	submittedAt: string;
	updatedAt: string;
	attachmentUrls?: string[];
	additionalDetails?: Record<string, unknown>;
}

/**
 * Interface for insurance form submission data
 */
export interface InsuranceFormSubmitRequest {
	formId: string;
	data: Record<string, unknown>; // Field values submitted by user
	attachments?: File[];
}

/**
 * Request type for filtering submissions
 */
export interface InsuranceSubmissionsFilterRequest {
	formId?: string;
	status?: "pending" | "approved" | "rejected";
	dateFrom?: string;
	dateTo?: string;
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

/**
 * Interface for generic paginated responses
 */
export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
	};
}

/**
 * Paginated response for submissions
 */
export interface PaginatedInsuranceSubmissionsResponse {
	columns: string[];
	data: InsuranceSubmissionData[];
	meta: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
	};
}
