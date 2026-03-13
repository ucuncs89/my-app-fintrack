import '~/styles/globals.css';

import { type Metadata } from 'next';

import { TRPCReactProvider } from '~/trpc/react';
import { TooltipProvider } from '~/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'FinTrack - Financial Dashboard',
  description: 'Personal finance management dashboard',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
