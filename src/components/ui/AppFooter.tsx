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
        {/* Brand */}
        <div className="app-footer-brand">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="app-footer-flame"
            aria-hidden="true"
          >
            <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0C17 8 12 2 12 2zm0 15a3 3 0 0 1-3-3c0-2.5 3-7 3-7s3 4.5 3 7a3 3 0 0 1-3 3z" />
          </svg>
          <span className="app-footer-brand-name">FireGuard ERP</span>
        </div>

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
