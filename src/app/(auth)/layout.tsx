export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4">
      {children}
    </div>
  );
}
