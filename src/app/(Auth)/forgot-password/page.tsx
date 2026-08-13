"use client";

// ============================================================
// src/app/(Auth)/forgot-password/page.tsx
// Request a password reset email.
// ============================================================

import React, { useActionState, useEffect, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Mail, ArrowLeft } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/app/actions/auth";
import FormInput from "@/components/ui/FormInput";
import FormButton from "@/components/ui/FormButton";
import type { ActionState } from "@/types/auth";

const initialState: ActionState = { success: false, message: "" };

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
      if (state.errors) {
        for (const [field, messages] of Object.entries(state.errors)) {
          setError(field as keyof ForgotPasswordFormValues, {
            type: "server",
            message: messages[0],
          });
        }
      }
    }
  }, [state, setError]);

  const onSubmit = (values: ForgotPasswordFormValues) => {
    const formData = new FormData();
    formData.append("email", values.email);

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
            <h1 className="text-2xl font-black tracking-tight">Forgot Password?</h1>
            <p className="text-red-200 text-sm mt-1">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {/* Form */}
          <div className="px-5 sm:px-8 py-6">
            {state.success ? (
              /* Success state */
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Check Your Email</h2>
                <p className="text-sm text-gray-500 mb-6">{state.message}</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormInput
                  id="email"
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your registered email"
                  icon={<Mail size={17} />}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <div className="mt-2">
                  <FormButton type="submit" loading={isPending} loadingText="Sending Link...">
                    <Mail size={17} aria-hidden="true" />
                    Send Reset Link
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
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 CDN Fire Engineering (Pvt) Ltd.
        </p>
      </div>
    </div>
  );
}
