"use client";

// ============================================================
// src/components/auth/ToastProvider.tsx
// Single global React Toastify container for the application.
// Rendered once in src/app/layout.tsx.
// ============================================================

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      toastClassName="!bg-[#161d2e] !border !border-[#1e2a3d] !text-[#dce3ef] !text-sm !rounded-xl !shadow-2xl !px-4 !py-3"
    />
  );
}
