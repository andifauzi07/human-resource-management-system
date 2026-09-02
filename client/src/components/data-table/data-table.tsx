import { ArrowDown, ArrowUp, ChevronsUpDown, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useDataListing } from './use-data-listing';
import type { Column } from './types';
import type { ReactNode } from 'react';

interface DataTableProps<T> {
	columns: Column<T>[];
	rows: T[];
	searchEnabled?: boolean;
	searchPlaceholder?: string;
	getRowKey: (row: T) => string;
	emptyState?: ReactNode;
	loading?: boolean;
	loadingSkeleton?: ReactNode;
	defaultSortKey?: string;
	defaultPageSize?: number;
}

function SortIndicator({ dir }: { dir: 'asc' | 'desc' | null }) {
	if (dir === 'asc') return <ArrowUp className="size-3.5" />;
	if (dir === 'desc') return <ArrowDown className="size-3.5" />;
	return <ChevronsUpDown className="size-3.5 opacity-40" />;
}

export function DataTable<T>({
	columns,
	rows,
	searchEnabled = false,
	searchPlaceholder = 'Cari…',
	getRowKey,
	emptyState,
	loading = false,
	loadingSkeleton,
	defaultSortKey,
	defaultPageSize,
}: DataTableProps<T>) {
	const listing = useDataListing(rows, {
		columns,
		searchEnabled,
		defaultSortKey,
		defaultPageSize,
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				{searchEnabled && (
					<div className="relative w-full max-w-xs">
						<Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={listing.searchTerm}
							onChange={(event) => listing.setSearchTerm(event.target.value)}
							placeholder={searchPlaceholder}
							className="pl-8"
						/>
					</div>
				)}
				{Object.keys(listing.filters).length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={listing.clearFilters}
						className="gap-1.5 text-muted-foreground">
						<X className="size-3.5" />
						Bersihkan filter
					</Button>
				)}
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((column) => {
							const isSortable = column.type !== 'action' && column.sortable;
							const isActiveSort = listing.sortKey === column.key;
							return (
								<TableHead
									key={column.key}
									className={cn(column.headerClassName)}>
									<div className="flex items-center gap-1.5">
										{isSortable ? (
											<button
												type="button"
												onClick={() => listing.setSort(column.key)}
												className={cn(
													'flex items-center gap-1.5 font-medium transition-colors hover:text-foreground',
													isActiveSort ? 'text-foreground' : 'text-muted-foreground',
												)}>
												{column.header}
												<SortIndicator dir={isActiveSort ? listing.sortDir : null} />
											</button>
										) : (
											<span className="text-muted-foreground">{column.header}</span>
										)}

										{column.type === 'category' && column.filterable && (
											<FilterDropdown
												label={column.header}
												options={listing.getFilterOptions(column.key)}
												value={listing.filters[column.key]}
												onChange={(value) => listing.setFilter(column.key, value)}
											/>
										)}
									</div>
								</TableHead>
							);
						})}
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						loadingSkeleton
					) : listing.pageRows.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={columns.length}
								className="h-24 text-center text-muted-foreground">
								{emptyState ?? 'Tidak ada data.'}
							</TableCell>
						</TableRow>
					) : (
						listing.pageRows.map((row) => (
							<TableRow key={getRowKey(row)}>
								{columns.map((column) => (
									<TableCell
										key={column.key}
										className={cn(column.className)}>
										{column.type === 'action' && column.render
											? column.render(row)
											: formatCell(column, row)}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>Baris per halaman</span>
					<Select
						value={String(listing.pageSize)}
						onValueChange={(value) => listing.setPageSize(Number(value))}>
						<SelectTrigger
							size="sm"
							className="h-8 w-18">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{listing.pageSizeOptions.map((size) => (
								<SelectItem
									key={size}
									value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<span>
						{listing.totalRows === 0
							? '0 baris'
							: `${(listing.page - 1) * listing.pageSize + 1}–
                ${Math.min(listing.page * listing.pageSize, listing.totalRows)}
                dari ${listing.totalRows}`}
					</span>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						disabled={listing.page <= 1}
						onClick={() => listing.setPage(listing.page - 1)}>
						Sebelumnya
					</Button>
					<span className="px-3 text-sm text-muted-foreground">
						{listing.page} / {listing.pageCount}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={listing.page >= listing.pageCount}
						onClick={() => listing.setPage(listing.page + 1)}>
						Berikutnya
					</Button>
				</div>
			</div>
		</div>
	);
}

function formatCell<T>(column: Column<T>, row: T) {
	const value = column.getValue(row);
	if (value == null) return '—';
	if (value instanceof Date) {
		return value.toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}
	return String(value);
}

interface FilterDropdownProps {
	label: string;
	options: string[];
	value?: string | number;
	onChange: (value: string | number) => void;
}

function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label={`Filter ${label}`}
					className={cn('size-6', value !== undefined && 'text-primary')}>
					<ChevronsUpDown className="size-3.5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="max-h-72 w-48 overflow-y-auto">
				<DropdownMenuItem
					onSelect={() => onChange('all')}
					className="justify-between">
					(Semua)
					{value === undefined && <Badge variant="secondary">aktif</Badge>}
				</DropdownMenuItem>
				{options.map((option) => (
					<DropdownMenuItem
						key={option}
						onSelect={() => onChange(option)}
						className="justify-between">
						{option}
						{String(value) === option && <Badge variant="secondary">aktif</Badge>}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
