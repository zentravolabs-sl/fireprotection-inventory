"use client";

// ============================================================
// src/app/(Auth)/register/page.tsx
// Registration page — React Hook Form + Zod + Server Action (startTransition).
// ============================================================

import React, { useActionState, useEffect, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Lock, Mail, User } from "lucide-react";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { registerAction } from "@/app/actions/auth";
import FormInput from "@/components/ui/FormInput";
import FormButton from "@/components/ui/FormButton";
import type { ActionState } from "@/types/auth";

const initialState: ActionState = { success: false, message: "" };

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      router.push("/login");
    } else {
      toast.error(state.message);
      if (state.errors) {
        for (const [field, messages] of Object.entries(state.errors)) {
          setError(field as keyof RegisterFormValues, {
            type: "server",
            message: messages[0],
          });
        }
      }
    }
  }, [state, router, setError]);

  const onSubmit = (values: RegisterFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("confirmPassword", values.confirmPassword);

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Red header strip */}
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
            <h1 className="text-2xl font-black tracking-tight">Create Account</h1>
            <p className="text-red-200 text-sm mt-1">
              CDN Fire Engineering — Staff Portal
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormInput
                id="name"
                label="Full Name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                icon={<User size={17} />}
                error={errors.name?.message}
                {...register("name")}
              />
              <FormInput
                id="email"
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                icon={<Mail size={17} />}
                error={errors.email?.message}
                {...register("email")}
              />
              <FormInput
                id="password"
                label="Password"
                isPassword
                autoComplete="new-password"
                placeholder="Create a strong password"
                icon={<Lock size={17} />}
                error={errors.password?.message}
                {...register("password")}
              />
              <FormInput
                id="confirmPassword"
                label="Confirm Password"
                isPassword
                autoComplete="new-password"
                placeholder="Re-enter your password"
                icon={<Lock size={17} />}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <div className="mt-2">
                <FormButton type="submit" loading={isPending} loadingText="Creating Account...">
                  <User size={17} aria-hidden="true" />
                  Create Account
                </FormButton>
              </div>

              <p className="text-center mt-4 text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-red-600 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
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
