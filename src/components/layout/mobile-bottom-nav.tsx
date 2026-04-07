'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import {
  DASHBOARD_BOTTOM_PRIMARY_NAV,
  isDashboardNavHrefActive,
} from '~/components/layout/dashboard-nav';
import { cn } from '~/lib/utils';
import { useSidebar } from '~/components/ui/sidebar';

export const MobileBottomNav = (): React.ReactElement => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 md:hidden',
        'border-t border-border/60',
        'bg-background/90 supports-backdrop-filter:bg-background/75 backdrop-blur-xl',
        'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
      )}
      aria-label="Primary navigation"
      role="navigation"
    >
      {/* Active item gradient glow on top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="grid h-16 grid-cols-4">
        {DASHBOARD_BOTTOM_PRIMARY_NAV.map((item) => {
          const active = isDashboardNavHrefActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-2',
                'text-[11px] font-medium leading-tight transition-all duration-200',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground',
              )}
            >
              {/* Icon container with active bg pill */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl px-3 py-1 transition-all duration-200',
                  active
                    ? 'bg-primary/10 dark:bg-primary/15'
                    : 'bg-transparent',
                )}
              >
                <item.icon
                  className={cn(
                    'size-5 shrink-0 transition-all duration-200',
                    active ? 'text-primary' : 'text-muted-foreground',
                    active && 'scale-110',
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                />
              </div>
              <span
                className={cn(
                  'line-clamp-1 w-full text-center transition-all duration-200',
                  active ? 'font-semibold text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
              {/* Active dot indicator */}
              {active && <span className="mobile-nav-active-dot" />}
            </Link>
          );
        })}

        {/* More / Menu button */}
        <button
          type="button"
          id="mobile-nav-menu-btn"
          className={cn(
            'relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-2',
            'text-[11px] font-medium leading-tight',
            'text-muted-foreground transition-all duration-200',
            'active:text-foreground',
          )}
          onClick={() => setOpenMobile(true)}
        >
          <div className="flex items-center justify-center rounded-xl bg-transparent px-3 py-1 transition-all duration-200">
            <Menu className="size-5 shrink-0" strokeWidth={1.8} aria-hidden />
          </div>
          <span className="line-clamp-1 w-full text-center">Menu</span>
        </button>
      </div>
    </nav>
  );
};
