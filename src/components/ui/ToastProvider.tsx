"use client";

// ============================================================
// src/components/ui/ToastProvider.tsx
// Client component wrapper for react-toastify's ToastContainer.
// ============================================================

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-right"
      theme="dark"
      toastClassName="bg-[#161d2e] border border-[#1e2a3d] text-[#dce3ef] text-sm rounded-xl shadow-2xl px-4 py-3 mb-2"
    />
  );
}
