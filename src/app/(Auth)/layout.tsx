// ============================================================
// src/app/(Auth)/layout.tsx
// Layout for authentication pages.
// Unauthenticated users see the full-bleed split design.
// ============================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
