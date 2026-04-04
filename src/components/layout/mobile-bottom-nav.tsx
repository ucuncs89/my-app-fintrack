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
        'bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md md:hidden',
        'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
      )}
      aria-label="Primary"
    >
      <div className="grid h-14 grid-cols-4">
        {DASHBOARD_BOTTOM_PRIMARY_NAV.map((item) => {
          const active = isDashboardNavHrefActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-muted-foreground flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
                active && 'text-foreground',
              )}
            >
              <item.icon
                className={cn('size-5 shrink-0', active && 'text-primary')}
                aria-hidden
              />
              <span className="line-clamp-1 w-full text-center">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors"
          onClick={() => setOpenMobile(true)}
        >
          <Menu className="size-5 shrink-0" aria-hidden />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
};
