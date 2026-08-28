import { Link } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { filterNavForRole, navSections } from '@/features/shell/navigation';
import { Building2 } from 'lucide-react';

export function Sidebar() {
	const role = useAuthStore((s) => s.user?.role);
	const sections = filterNavForRole(navSections, role);

	return (
		<aside className="flex w-64 shrink-0 flex-col border-r bg-card">
			<div className="flex h-16 items-center gap-2 border-b px-6">
				<span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
					<Building2 className="size-4" />
				</span>
				<span className="text-sm font-semibold tracking-tight">HRIS</span>
			</div>

			<nav
				className="flex-1 overflow-y-auto px-3 py-4"
				aria-label="Navigasi utama">
				{sections.map((section, idx) => (
					<div
						key={idx}
						className="mb-6 last:mb-0">
						{section.title && (
							<p className="px-3 pb-2 text-xs font-medium text-muted-foreground">{section.title}</p>
						)}
						<ul className="grid gap-1">
							{section.items.map((item) => {
								const Icon = item.icon;
								return (
									<li key={item.label}>
										<Link
											to={item.to}
											disabled={item.disabled}
											className={cn(
												'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
												'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
												'data-[status=active]:bg-accent data-[status=active]:text-accent-foreground',
												item.disabled &&
													'pointer-events-none cursor-not-allowed text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground/50',
											)}
											title={item.disabled ? 'Segera hadir' : undefined}>
											<Icon className="size-4" />
											{item.label}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</nav>

			<Separator />
			<div className="px-4 py-3 text-xs text-muted-foreground">
				© {new Date().getFullYear()} HRIS
			</div>
		</aside>
	);
}
