// ============================================================
// src/components/ui/AppFooter.tsx
// Persistent footer for all main application pages.
// Server Component — no client state needed.
// ============================================================

import React from "react";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">

        {/* Copyright */}
        <p className="app-footer-copy">
          &copy; {year} CDN Fire Engineering (Pvt) Ltd. All rights reserved.
        </p>

        {/* Version / build tag */}
        <span className="app-footer-version">v1.0.0</span>
      </div>
    </footer>
  );
}
