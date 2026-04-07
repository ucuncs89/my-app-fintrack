import { AppSidebar } from '~/components/layout/app-sidebar';
import { MobileBottomNav } from '~/components/layout/mobile-bottom-nav';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar';
import { Separator } from '~/components/ui/separator';
import { ThemeToggle } from '~/components/theme-toggle';
import { Wallet } from 'lucide-react';

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-40 flex w-full shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4 h-14 md:h-16 border-b border-border/50 bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Desktop sidebar trigger */}
            <SidebarTrigger
              id="sidebar-trigger"
              className="-ml-1 hidden md:flex"
            />
            <Separator
              orientation="vertical"
              className="mr-2 hidden h-4 md:block opacity-40"
            />
            {/* Mobile logo */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
                <Wallet className="size-4" />
              </div>
              <span className="text-sm font-bold tracking-tight">FinTrack</span>
            </div>
            {/* Desktop breadcrumb / title */}
            <span className="hidden md:block text-sm font-medium text-muted-foreground">
              FinTrack
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </SidebarInset>

      <MobileBottomNav />
    </SidebarProvider>
  );
}
