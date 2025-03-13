import {
	HydrationBoundary,
	QueryClient,
	dehydrate,
} from "@tanstack/react-query";
import { Link } from "react-router";
import { useState, useMemo } from "react";
import { useLoaderData } from "react-router";
import { useTranslation } from "react-i18next";
import {
	useInsuranceFormSubmissions,
	prefetchInsuranceFormSubmissions,
} from "~/api/hooks/insurance";
import type { InsuranceSubmissionData } from "~/api/types/insurance";
import {
	IconSettings,
	IconArrowBarToRight,
	IconArrowBarToLeft,
	IconArrowLeft,
	IconArrowRight,
	IconGripHorizontal,
	IconSearch,
	IconGripVertical,
} from "@tabler/icons-react";
import {
	Table,
	Input,
	Select,
	Group,
	Text,
	Box,
	Checkbox,
	Menu,
	ActionIcon,
	Pagination,
	HoverCard,
} from "@mantine/core";
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	flexRender,
	createColumnHelper,
	type SortingState,
	type ColumnFiltersState,
	type FilterFn,
	type VisibilityState,
	type ColumnOrderState,
	type Header,
} from "@tanstack/react-table";
import { rankItem } from "@tanstack/match-sorter-utils";
import { match } from "ts-pattern";
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
	horizontalListSortingStrategy,
	useSortable,
	arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const fuzzyFilter: FilterFn<InsuranceSubmissionData> = (
	row,
	columnId,
	value,
	addMeta,
) => {
	const itemRank = rankItem(row.getValue(columnId), value);
	addMeta({ itemRank });
	return itemRank.passed;
};

interface SortableColumnHeaderProps {
	header: Header<InsuranceSubmissionData, unknown>;
	id: string;
}

function SortableColumnHeader({ header, id }: SortableColumnHeaderProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	const { t } = useTranslation();

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		cursor: "move",
		width: "100%",
	};

	const column = header.column;
	const columnFilterValue = column.getFilterValue() as string;

	return (
		<div ref={setNodeRef} style={style}>
			<HoverCard width="full" shadow="md" openDelay={300}>
				<HoverCard.Target>
					<div
						className="flex items-center"
						onClick={column.getToggleSortingHandler()}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								column.toggleSorting();
							}
						}}
					>
						<div
							{...attributes}
							{...listeners}
							className="mr-2 text-gray-400 flex items-center"
						>
							<IconGripVertical size={16} style={{ cursor: "grab" }} />
						</div>
						<div className="flex-1">
							{flexRender(header.column.columnDef.header, header.getContext())}
						</div>
						<span className="ml-2">
							{{
								asc: "↑",
								desc: "↓",
							}[column.getIsSorted() as string] ?? ""}
						</span>
					</div>
				</HoverCard.Target>
				<HoverCard.Dropdown>
					<Text size="sm">
						{t("submissions.page.hoverCard.sortAscending")}{" "}
						{match(column.getIsSorted())
							.with("asc", () => t("submissions.page.hoverCard.sortDescending"))
							.with("desc", () => t("submissions.page.hoverCard.clearSort"))
							.otherwise(() => t("submissions.page.hoverCard.sortAscending"))}
					</Text>
				</HoverCard.Dropdown>
			</HoverCard>

			{column.getCanFilter() ? (
				<div className="mt-2">
					<Input
						size="xs"
						placeholder={t("submissions.page.columnSearch")}
						value={columnFilterValue || ""}
						leftSection={<IconSearch size={16} />}
						onChange={(e) => column.setFilterValue(e.target.value)}
					/>
				</div>
			) : null}
		</div>
	);
}

export function meta() {
	const { t } = useTranslation();
	return [
		{ title: t("submissions.meta.title") },
		{
			property: "og:title",
			content: t("submissions.meta.ogTitle"),
		},
		{
			name: "description",
			content: t("submissions.meta.description"),
		},
	];
}

export async function loader() {
	const queryClient = new QueryClient();

	try {
		await prefetchInsuranceFormSubmissions(queryClient);

		return {
			dehydratedState: dehydrate(queryClient),
		};
	} catch (error) {
		console.error("Error prefetching insurance submissions:", error);
		return {
			dehydratedState: dehydrate(queryClient),
			error: "Failed to load insurance submissions",
		};
	}
}

export default function Submissions() {
	const { dehydratedState, error } = useLoaderData<typeof loader>();

	return (
		<HydrationBoundary state={dehydratedState}>
			<SubmissionsContent serverError={error} />
		</HydrationBoundary>
	);
}

function SubmissionsContent({
	serverError,
}: {
	serverError?: string;
}) {
	const { t } = useTranslation();
	const { data, isLoading, isError, error } = useInsuranceFormSubmissions();
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

	// Set up DnD sensors
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5, // 5px movement required before dragging starts
			},
		}),
		useSensor(KeyboardSensor),
	);

	const columnHelper = createColumnHelper<InsuranceSubmissionData>();

	const columns = useMemo(() => {
		if (!data?.columns) return [];
		return data.columns.map((column) =>
			columnHelper.accessor(column as string, {
				header: column,
				cell: (info) => {
					const value = info.getValue();
					if (typeof value === "boolean")
						return value
							? t("submissions.page.booleanValues.yes")
							: t("submissions.page.booleanValues.no");
					return value !== null && value !== undefined ? String(value) : "-";
				},
				enableColumnFilter: true,
			}),
		);
	}, [data?.columns, columnHelper, t]);

	const table = useReactTable({
		data: data?.data || [],
		columns: columns || [],
		state: {
			sorting,
			globalFilter,
			columnFilters,
			columnVisibility,
			columnOrder,
		},
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnOrderChange: setColumnOrder,
		enableColumnResizing: true,
		columnResizeMode: "onChange",
		globalFilterFn: fuzzyFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	// Handle drag end event for column reordering
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = table
				.getAllLeafColumns()
				.findIndex((col) => col.id === active.id);
			const newIndex = table
				.getAllLeafColumns()
				.findIndex((col) => col.id === over.id);

			// Get current column order or generate from visible columns if empty
			const currentColOrder = columnOrder.length
				? columnOrder
				: table.getAllLeafColumns().map((col) => col.id);

			// Reorder the columns using arrayMove from dnd-kit
			const newColumnOrder = arrayMove(currentColOrder, oldIndex, newIndex);
			setColumnOrder(newColumnOrder);
		}
	};

	if (isLoading) {
		return <div className="p-6">{t("submissions.page.loading")}</div>;
	}

	if (isError || serverError) {
		return (
			<div className="p-6 text-red-600">
				{t("submissions.page.error", {
					errorMessage: serverError || error?.message || "Unknown error",
				})}
			</div>
		);
	}

	if (!data?.data || data.data.length === 0) {
		return <p className="p-6">{t("submissions.page.noSubmissions")}</p>;
	}

	// Get the visible column IDs for the SortableContext
	const columnIds = table.getAllLeafColumns().map((column) => column.id);

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">{t("submissions.page.title")}</h1>
				<Link
					to="/"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
				>
					{t("submissions.page.newSubmission")}
				</Link>
			</div>

			<Group justify="space-between" mb={16}>
				<Input
					className="w-sm"
					value={globalFilter || ""}
					leftSection={<IconSearch size={16} />}
					onChange={(e) => setGlobalFilter(e.target.value)}
					placeholder={t("submissions.page.search")}
				/>

				<Menu shadow="md" width={200}>
					<Menu.Target>
						<ActionIcon
							variant="light"
							aria-label={t("submissions.page.columnSettings")}
						>
							<IconSettings size={18} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Label>{t("submissions.page.toggleColumns")}</Menu.Label>
						{table.getAllLeafColumns().map((column) => {
							const isOnlyVisibleColumn =
								table.getVisibleLeafColumns().length === 1 &&
								column.getIsVisible();

							return (
								<Menu.Item key={column.id} closeMenuOnClick={false}>
									<Checkbox
										disabled={isOnlyVisibleColumn}
										checked={column.getIsVisible()}
										onChange={column.getToggleVisibilityHandler()}
										label={String(column.columnDef.header)}
									/>
								</Menu.Item>
							);
						})}
					</Menu.Dropdown>
				</Menu>
			</Group>

			<Box className="overflow-x-auto">
				<Table striped highlightOnHover withTableBorder withColumnBorders>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<Table.Thead>
							{table.getHeaderGroups().map((headerGroup) => (
								<SortableContext
									key={headerGroup.id}
									items={columnIds}
									strategy={horizontalListSortingStrategy}
								>
									<Table.Tr>
										{headerGroup.headers.map((header) => (
											<Table.Th
												key={header.id}
												style={{ position: "relative" }}
											>
												<SortableColumnHeader
													header={header}
													id={header.column.id}
												/>
											</Table.Th>
										))}
									</Table.Tr>
								</SortableContext>
							))}
						</Table.Thead>
					</DndContext>
					<Table.Tbody>
						{table.getRowModel().rows.map((row) => (
							<Table.Tr key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<Table.Td key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</Table.Td>
								))}
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Box>

			<Group justify="space-between" align="center" mt={16}>
				<Text size="sm" c="dimmed">
					{t("submissions.page.showing", {
						visible: table.getRowModel().rows.length,
						total: data?.data.length,
					})}
				</Text>

				<Group>
					<Pagination.Root
						total={table.getPageCount()}
						value={table.getState().pagination.pageIndex + 1}
						onChange={(page) => table.setPageIndex(page - 1)}
					>
						<Group gap={7}>
							<Pagination.First
								icon={IconArrowBarToLeft}
								onClick={() => table.setPageIndex(0)}
								disabled={!table.getCanPreviousPage()}
							/>
							<Pagination.Previous
								icon={IconArrowLeft}
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							/>
							<Pagination.Items dotsIcon={IconGripHorizontal} />
							<Pagination.Next
								icon={IconArrowRight}
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							/>
							<Pagination.Last
								icon={IconArrowBarToRight}
								onClick={() => table.setPageIndex(table.getPageCount() - 1)}
								disabled={!table.getCanNextPage()}
							/>
						</Group>
					</Pagination.Root>

					<Select
						value={table.getState().pagination.pageSize.toString()}
						onChange={(value) => table.setPageSize(Number(value))}
						data={[
							{ value: "10", label: t("submissions.page.pagination.show10") },
							{ value: "25", label: t("submissions.page.pagination.show25") },
							{ value: "50", label: t("submissions.page.pagination.show50") },
						]}
						size="xs"
						disabled={data?.data.length <= 10}
					/>
				</Group>
			</Group>
		</div>
	);
}
