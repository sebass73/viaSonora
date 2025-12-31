// Root layout for next-intl
// This layout is required by Next.js but should be minimal
// The actual HTML structure is in app/[locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For next-intl, the root layout should just pass through children
  // The locale layout will provide the HTML structure
  return <>{children}</>;
}
