'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, Settings, Wallet } from 'lucide-react';

import {
  DASHBOARD_FULL_NAV,
  isDashboardNavHrefActive,
} from '~/components/layout/dashboard-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '~/components/ui/sidebar';
import { authClient } from '~/lib/auth-client';

export const AppSidebar = (
  props: React.ComponentProps<typeof Sidebar>,
): React.ReactElement => {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Wallet className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">FinTrack</span>
                  <span className="truncate text-xs">Finance Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DASHBOARD_FULL_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isDashboardNavHrefActive(pathname, item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isDashboardNavHrefActive(pathname, '/settings')}
              tooltip="Settings"
            >
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {session ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign Out"
                onClick={() => {
                  void authClient.signOut().then(() => {
                    window.location.assign('/sign-in');
                  });
                }}
              >
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Sign In">
                <Link href="/sign-in">
                  <LogIn />
                  <span>Sign In</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
