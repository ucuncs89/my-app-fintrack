'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  DASHBOARD_BOTTOM_PRIMARY_NAV,
  isDashboardNavHrefActive,
} from '~/components/layout/dashboard-nav';
import { cn } from '~/lib/utils';
import { useSidebar } from '~/components/ui/sidebar';

export const MobileBottomNav = (): React.ReactElement => {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  // Sync active index for animation
  useEffect(() => {
    const idx = DASHBOARD_BOTTOM_PRIMARY_NAV.findIndex((item) =>
      isDashboardNavHrefActive(pathname, item.href)
    );
    setActiveIdx(idx);
  }, [pathname]);

  return (
    <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-4 md:hidden">
      <nav
        className={cn(
          'relative flex h-16 w-full max-w-sm items-center overflow-hidden px-1',
          'rounded-[2rem] border border-border/40 bg-background/80 shadow-2xl backdrop-blur-2xl dark:bg-zinc-900/80',
        )}
        aria-label="Mobile navigation"
      >
        {/* Animated Active Pill Background */}
        <AnimatePresence>
          {activeIdx !== -1 && (
            <motion.div
              className="absolute inset-y-0 flex items-center justify-center p-1"
              initial={false}
              animate={{
                x: `${(activeIdx < 2 ? activeIdx : activeIdx + 1) * 100}%`,
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              style={{ width: '20%', left: 0 }}
            >
              <div className="h-11 w-full rounded-2xl bg-primary/10 dark:bg-primary/20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Items (First 2) */}
        {DASHBOARD_BOTTOM_PRIMARY_NAV.slice(0, 2).map((item, _idx) => {
          const active = isDashboardNavHrefActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-full w-1/5 flex-col items-center justify-center pt-1 transition-all duration-300 active:scale-90',
                'z-10',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon
                className={cn('size-5', active && 'scale-110')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-tight">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}

        {/* Center Action Button Slot */}
        <div className="z-10 flex h-full w-1/5 items-center justify-center overflow-visible">
          <button
            type="button"
            className={cn(
              'group relative flex size-11 items-center justify-center rounded-2xl bg-primary shadow-lg transition-all duration-300 active:scale-95 active:shadow-inner',
              'hover:rotate-90',
            )}
          >
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-active:opacity-100" />
            <Plus className="size-6 text-primary-foreground transition-transform" />
          </button>
        </div>

        {/* Navigation Items (Last 1) */}
        {DASHBOARD_BOTTOM_PRIMARY_NAV.slice(2, 3).map((item) => {
          const active = isDashboardNavHrefActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-full w-1/5 flex-col items-center justify-center pt-1 transition-all duration-300 active:scale-90',
                'z-10',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <item.icon
                className={cn('size-5', active && 'scale-110')}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-tight">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}

        {/* Side Menu Button */}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="relative z-10 flex h-full w-1/5 flex-col items-center justify-center pt-1 text-muted-foreground transition-all duration-300 active:scale-90 active:text-foreground"
        >
          <Menu className="size-5" strokeWidth={2} />
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-tight opacity-70">
            More
          </span>
        </button>
      </nav>
    </div>
  );
};
