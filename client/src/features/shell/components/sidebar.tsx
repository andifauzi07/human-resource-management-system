import { Link } from '@tanstack/react-router';
import { Building2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { filterNavForRole, navSections } from '@/features/shell/navigation';

interface SidebarProps {
  /** Mode expanded (ikon + label). False = icon-only dengan Tooltip label. */
  expanded?: boolean;
  /** Callback toggle ciutkan/perluas. Jika tidak disediakan, tombol disembunyikan. */
  onToggle?: () => void;
}

export function Sidebar({ expanded = false, onToggle }: SidebarProps) {
  const role = useAuthStore((s) => s.user?.role);
  const sections = filterNavForRole(navSections, role);

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r bg-card transition-[width] duration-200',
        expanded ? 'w-64' : 'w-16'
      )}>
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b',
          expanded ? 'justify-start gap-2 px-4' : 'justify-center'
        )}>
        <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Building2 className="size-4" />
        </span>
        {expanded && (
          <span className="text-sm font-semibold tracking-tight">HRIS</span>
        )}
      </div>

      <TooltipProvider delayDuration={0}>
        <nav
          className="flex-1 overflow-y-auto px-2 py-4"
          aria-label="Navigasi utama">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className={cn('flex flex-col', expanded ? 'mb-6' : 'mb-4')}>
              {section.title && expanded && (
                <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">
                  {section.title}
                </p>
              )}
              <ul className="grid gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const link = (
                    <Link
                      to={item.to}
                      disabled={item.disabled}
                      aria-label={expanded ? undefined : item.label}
                      className={cn(
                        'flex items-center rounded-md transition-colors',
                        expanded
                          ? 'gap-3 px-3 py-2 text-sm font-medium'
                          : 'justify-center px-1 py-2',
                        'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        'data-[status=active]:bg-accent data-[status=active]:text-accent-foreground',
                        item.disabled &&
                          'pointer-events-none cursor-not-allowed text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground/50'
                      )}>
                      <Icon className="size-4 shrink-0" />
                      {expanded && item.label}
                    </Link>
                  );

                  return (
                    <li key={item.label}>
                      {expanded ? (
                        link
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.disabled ? 'Segera hadir' : item.label}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </TooltipProvider>

      <Separator />
      {onToggle && (
        <div className="p-2">
          {expanded ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded="true"
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50">
              <ChevronsLeft className="size-4 shrink-0" />
              Ciutkan
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded="false"
                  aria-label="Perluas sidebar"
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-center rounded-md p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50">
                  <ChevronsRight className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Perluas</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </aside>
  );
}