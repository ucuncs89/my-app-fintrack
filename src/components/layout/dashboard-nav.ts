import {
  ArrowLeftRight,
  BarChart3,
  BookMarked,
  LayoutDashboard,
  PieChart,
  PiggyBank,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const DASHBOARD_FULL_NAV: readonly DashboardNavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Accounts', href: '/accounts', icon: Wallet },
  { label: 'Asset catalog', href: '/asset-catalog', icon: BookMarked },
  { label: 'Portfolio', href: '/portfolio', icon: PieChart },
  { label: 'Budget', href: '/budget', icon: PiggyBank },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
] as const;

export const DASHBOARD_BOTTOM_PRIMARY_NAV: readonly DashboardNavItem[] =
  DASHBOARD_FULL_NAV.slice(0, 3);

export const isDashboardNavHrefActive = (
  pathname: string,
  href: string,
): boolean => {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(href);
};
