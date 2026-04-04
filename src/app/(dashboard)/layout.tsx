import { AppSidebar } from '~/components/layout/app-sidebar';
import { MobileBottomNav } from '~/components/layout/mobile-bottom-nav';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { Separator } from '~/components/ui/separator';

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 hidden md:flex" />
            <Separator
              orientation="vertical"
              className="mr-2 hidden h-4 md:block"
            />
            <span className="text-sm font-medium text-muted-foreground">
              FinTrack
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>
  );
}
