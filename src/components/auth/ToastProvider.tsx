"use client";

// ============================================================
// src/components/auth/ToastProvider.tsx
// React Toastify container — must live in a Client Component.
// Render this once near the root of the app.
// ============================================================

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      toastClassName="!rounded-xl !shadow-lg !font-sans !text-sm"
    />
  );
}
