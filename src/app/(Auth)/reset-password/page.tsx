"use client";

// ============================================================
// src/app/(Auth)/reset-password/page.tsx
// Reset password using the token from the email link.
// Token is read from the ?token= query parameter.
// useSearchParams is wrapped in Suspense per Next.js SSR rules.
// ============================================================

import React, { Suspense, useActionState, useEffect, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/app/actions/auth";
import FormInput from "@/components/ui/FormInput";
import FormButton from "@/components/ui/FormButton";
import type { ActionState } from "@/types/auth";

const initialState: ActionState = { success: false, message: "" };

// ── Inner form — reads searchParams safely inside Suspense ──

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      toast.error(state.message);
      if (state.errors) {
        for (const [field, messages] of Object.entries(state.errors)) {
          setError(field as keyof ResetPasswordFormValues, {
            type: "server",
            message: messages[0],
          });
        }
      }
    }
  }, [state, router, setError]);

  const onSubmit = (values: ResetPasswordFormValues) => {
    const formData = new FormData();
    formData.append("token", values.token);
    formData.append("password", values.password);
    formData.append("confirmPassword", values.confirmPassword);

    startTransition(() => {
      formAction(formData);
    });
  };

  // No token in URL
  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Invalid Reset Link</h2>
        <p className="text-sm text-gray-500 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-red-600 font-bold text-sm hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Hidden token field */}
      <input type="hidden" {...register("token")} value={token} />

      <FormInput
        id="password"
        label="New Password"
        isPassword
        autoComplete="new-password"
        placeholder="Create a new password"
        icon={<Lock size={17} />}
        error={errors.password?.message}
        {...register("password")}
      />
      <FormInput
        id="confirmPassword"
        label="Confirm New Password"
        isPassword
        autoComplete="new-password"
        placeholder="Re-enter your new password"
        icon={<Lock size={17} />}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="mt-2">
        <FormButton type="submit" loading={isPending} loadingText="Resetting Password...">
          <Lock size={17} aria-hidden="true" />
          Reset Password
        </FormButton>
      </div>

      <div className="text-center mt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}

// ── Page component ──────────────────────────────────────────

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-red-700 to-red-900 px-8 pt-8 pb-6 text-white text-center">
            <div className="relative w-12 h-10 mx-auto mb-3">
              <Image
                src="/images/cdn-fire-icon.png"
                alt="CDN Fire Logo"
                fill
                priority
                sizes="48px"
                style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Reset Password</h1>
            <p className="text-red-200 text-sm mt-1">
              Enter your new password below.
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-red-600" />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 CDN Fire Engineering (Pvt) Ltd.
        </p>
      </div>
    </div>
  );
}
