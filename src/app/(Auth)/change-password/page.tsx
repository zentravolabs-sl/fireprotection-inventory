"use client";

// ============================================================
// src/app/(Auth)/change-password/page.tsx
// Authenticated users can change their password.
// ============================================================

import React, { useActionState, useEffect, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Lock, ArrowLeft } from "lucide-react";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validations/auth";
import { changePasswordAction } from "@/app/actions/auth";
import FormInput from "@/components/ui/FormInput";
import FormButton from "@/components/ui/FormButton";
import type { ActionState } from "@/types/auth";

const initialState: ActionState = { success: false, message: "" };

export default function ChangePasswordPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      reset();
      setTimeout(() => router.push("/login"), 2500);
    } else {
      toast.error(state.message);
      if (state.errors) {
        for (const [field, messages] of Object.entries(state.errors)) {
          setError(field as keyof ChangePasswordFormValues, {
            type: "server",
            message: messages[0],
          });
        }
      }
    }
  }, [state, router, reset, setError]);

  const onSubmit = (values: ChangePasswordFormValues) => {
    const formData = new FormData();
    formData.append("currentPassword", values.currentPassword);
    formData.append("newPassword", values.newPassword);
    formData.append("confirmNewPassword", values.confirmNewPassword);

    startTransition(() => {
      formAction(formData);
    });
  };

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
            <h1 className="text-2xl font-black tracking-tight">Change Password</h1>
            <p className="text-red-200 text-sm mt-1">
              Update your account password below.
            </p>
          </div>

          {/* Security notice */}
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-3">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ Changing your password will sign out all other active sessions.
            </p>
          </div>

          {/* Form */}
          <div className="px-5 sm:px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormInput
                id="currentPassword"
                label="Current Password"
                isPassword
                autoComplete="current-password"
                placeholder="Enter your current password"
                icon={<Lock size={17} />}
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
              <FormInput
                id="newPassword"
                label="New Password"
                isPassword
                autoComplete="new-password"
                placeholder="Create a new strong password"
                icon={<Lock size={17} />}
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
              <FormInput
                id="confirmNewPassword"
                label="Confirm New Password"
                isPassword
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                icon={<Lock size={17} />}
                error={errors.confirmNewPassword?.message}
                {...register("confirmNewPassword")}
              />

              <div className="mt-2">
                <FormButton type="submit" loading={isPending} loadingText="Changing Password...">
                  <Lock size={17} aria-hidden="true" />
                  Change Password
                </FormButton>
              </div>

              <div className="text-center mt-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors"
                >
                  <ArrowLeft size={15} />
                  Back to Dashboard
                </Link>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 CDN Fire Engineering (Pvt) Ltd.
        </p>
      </div>
    </div>
  );
}
