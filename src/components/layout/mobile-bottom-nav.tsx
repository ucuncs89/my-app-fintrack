'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  DASHBOARD_BOTTOM_PRIMARY_NAV,
  isDashboardNavHrefActive,
  type DashboardNavItem,
} from '~/components/layout/dashboard-nav';
import { cn } from '~/lib/utils';
import { useSidebar } from '~/components/ui/sidebar';

export const MobileBottomNav = (): React.ReactElement => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const renderNavItem = (item: DashboardNavItem) => {
    const active = isDashboardNavHrefActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className="relative z-10 flex h-full items-center justify-center focus:outline-none"
      >
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={cn(
            'flex flex-row items-center justify-center rounded-[1.25rem] px-3 py-2.5 transition-colors',
            active
              ? 'bg-primary/20 text-primary dark:bg-primary/25'
              : 'text-muted-foreground hover:bg-neutral-500/10 hover:text-foreground',
          )}
        >
          <item.icon
            className={cn('size-[1.125rem] shrink-0')}
            strokeWidth={active ? 2.5 : 2}
          />
          <AnimatePresence mode="popLayout">
            {active && (
              <motion.span
                layout
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ width: 'auto', opacity: 1, marginLeft: 6 }}
                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="overflow-hidden whitespace-nowrap text-[11px] font-bold tracking-tight"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    );
  };

  const handleGlobalAdd = () => {
    const btns = document.querySelectorAll<HTMLButtonElement>('[data-global-action="add"], #tx-add-btn');
    let clicked = false;
    btns.forEach((btn) => {
      // If it has offsetParent, it's visible.
      if (btn.offsetParent !== null && !clicked) {
        btn.click();
        clicked = true;
      }
    });

    if (!clicked) {
      console.warn('No visible Add action found for this page.');
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-2 md:hidden pointer-events-none">
      <motion.nav
        layout
        className={cn(
          'relative flex h-[4.25rem] w-fit items-center justify-between gap-1 px-1.5 pointer-events-auto',
          'rounded-[2.125rem] border border-border/50 bg-background/80 shadow-2xl backdrop-blur-2xl dark:bg-zinc-900/80',
        )}
        aria-label="Mobile navigation"
      >
        {/* Navigation Items (First 2) */}
        {DASHBOARD_BOTTOM_PRIMARY_NAV.slice(0, 2).map(renderNavItem)}

        {/* Center Action Button Slot */}
        <div className="z-10 flex items-center justify-center px-1">
          <button
            type="button"
            onClick={handleGlobalAdd}
            className={cn(
              'group relative flex size-[3rem] items-center justify-center rounded-[1.25rem] bg-primary shadow-lg shadow-primary/25 transition-transform duration-300 active:scale-95',
              'hover:rotate-90',
            )}
            aria-label="Add Item"
          >
            <div className="absolute inset-0 rounded-[1.25rem] bg-white/20 opacity-0 transition-opacity group-active:opacity-100" />
            <Plus
              className="size-6 text-primary-foreground transition-transform"
              strokeWidth={2.5}
            />
          </button>
        </div>

        {/* Navigation Items (Last 1) */}
        {DASHBOARD_BOTTOM_PRIMARY_NAV.slice(2, 3).map(renderNavItem)}

        {/* Side Menu Button */}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          aria-label="More"
          className="relative z-10 flex h-full items-center justify-center focus:outline-none"
        >
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'flex flex-row items-center justify-center rounded-[1.25rem] px-3 py-2.5 transition-colors',
              'text-muted-foreground hover:bg-neutral-500/10 hover:text-foreground',
            )}
          >
            <Menu className="size-[1.125rem] shrink-0" strokeWidth={2} />
          </motion.div>
        </button>
      </motion.nav>
    </div>
  );
};
