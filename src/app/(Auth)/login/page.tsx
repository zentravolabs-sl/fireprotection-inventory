"use client";

// ============================================================
// src/app/(Auth)/login/page.tsx
// Login page — React Hook Form + Zod + Server Action (startTransition).
//
// useSearchParams is wrapped in a Suspense boundary via the
// LoginForm component to satisfy Next.js SSR requirements.
//
// Mobile: single-column form (fire panel hidden).
// Desktop: split layout with fire scene on left, form on right.
// ============================================================

import React, { Suspense, useActionState, useEffect, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Lock, Mail } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { loginAction } from "@/app/actions/auth";
import FormInput from "@/components/ui/FormInput";
import FormButton from "@/components/ui/FormButton";
import type { ActionState } from "@/types/auth";

const initialState: ActionState = { success: false, message: "" };

// ── Inner form component — reads searchParams safely ────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      router.push(callbackUrl);
    } else {
      toast.error(state.message);
      if (state.errors) {
        for (const [field, messages] of Object.entries(state.errors)) {
          setError(field as keyof LoginFormValues, {
            type: "server",
            message: messages[0],
          });
        }
      }
    }
  }, [state, router, callbackUrl, setError]);

  const onSubmit = (values: LoginFormValues) => {
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);
    if (values.rememberMe) formData.append("rememberMe", "on");

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Email */}
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

      {/* Password */}
      <FormInput
        id="password"
        label="Password"
        isPassword
        autoComplete="current-password"
        placeholder="Enter your password"
        icon={<Lock size={17} />}
        error={errors.password?.message}
        {...register("password")}
      />

      {/* Remember me & Forgot password */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            id="rememberMe"
            type="checkbox"
            {...register("rememberMe")}
            style={{ width: 16, height: 16, accentColor: "#dc2626", cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.84rem", color: "#374151", fontWeight: 500 }}>
            Remember me
          </span>
        </label>

        <Link
          href="/forgot-password"
          style={{
            fontSize: "0.84rem",
            fontWeight: 700,
            color: "#dc2626",
            textDecoration: "none",
          }}
          className="hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit button */}
      <FormButton
        type="submit"
        loading={isPending}
        loadingText="Signing In..."
      >
        <Lock size={17} aria-hidden="true" />
        Sign In
      </FormButton>

      {/* Register link */}
      <p
        style={{
          textAlign: "center",
          marginTop: 18,
          fontSize: "0.84rem",
          color: "#6b7280",
        }}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          style={{ color: "#dc2626", fontWeight: 700, textDecoration: "none" }}
          className="hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
}

// ── Page component ──────────────────────────────────────────

export default function LoginPage() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        overflow: "hidden",
        fontFamily: "var(--font-inter), Inter, -apple-system, sans-serif",
        backgroundColor: "#3e0004",
      }}
    >
      {/* ════════════════════════════════════════════════════
          LEFT PANEL — Fire scene background (hidden on mobile)
      ════════════════════════════════════════════════════ */}
      <div
        className="hidden sm:block"
        style={{
          position: "relative",
          width: "52%",
          minHeight: "100vh",
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: "#3e0004",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src="/images/fire-new2.jpeg"
            alt="CDN Fire Scene Background"
            fill
            priority
            sizes="52vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>

        {/* Right-edge gradient */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "35%",
            height: "100%",
            background:
              "linear-gradient(to right, transparent 0%, rgba(62,0,4,0.6) 40%, #3e0004 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Logo — upper left */}
        <div
          style={{
            position: "absolute",
            top: "11%",
            left: "10%",
            zIndex: 10,
            width: 125,
            height: 100,
          }}
        >
          <Image
            src="/images/cdn-fire-icon.png"
            alt="CDN FIRE ENGINEERING PVT LTD"
            fill
            priority
            sizes="125px"
            style={{
              objectFit: "contain",
              filter: "brightness(0) invert(1) drop-shadow(0 4px 14px rgba(0,0,0,0.6))",
            }}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          3D Fire Extinguisher — foreground (hidden on mobile)
      ════════════════════════════════════════════════════ */}
      <div
        className="hidden sm:block"
        style={{
          position: "absolute",
          left: "35%",
          bottom: "1.5%",
          width: 335,
          height: "86vh",
          zIndex: 30,
          pointerEvents: "none",
          minHeight: 480,
          maxHeight: 640,
        }}
      >
        <Image
          src="/images/fire-extinguisher.png"
          alt="3D Fire Extinguisher"
          fill
          priority
          sizes="335px"
          style={{
            objectFit: "contain",
            objectPosition: "bottom center",
            filter: "drop-shadow(14px 24px 32px rgba(0,0,0,0.65))",
          }}
        />
      </div>

      {/* ════════════════════════════════════════════════════
          RIGHT PANEL — White sign-in form
          Desktop: diagonal clip, 55% width, absolute positioned
          Mobile:  full width, no clip-path, centered
      ════════════════════════════════════════════════════ */}

      {/* Mobile layout — full screen white form */}
      <div
        className="flex sm:hidden"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          backgroundColor: "white",
          flexDirection: "column",
        }}
      >
        {/* Mobile logo header */}
        <div
          style={{
            background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
            padding: "28px 24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ position: "relative", width: 48, height: 40, margin: "0 auto 10px" }}>
            <Image
              src="/images/cdn-fire-icon.png"
              alt="CDN Fire Logo"
              fill
              priority
              sizes="48px"
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
            />
          </div>
          <h1 style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Welcome Back!
          </h1>
          <p style={{ color: "#fca5a5", fontSize: "0.84rem", marginTop: 4 }}>
            Sign in to continue to your account
          </p>
        </div>

        {/* Mobile form body */}
        <div style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>
          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
                <div className="h-12 bg-gray-100 rounded-xl" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Mobile footer */}
        <div
          style={{
            textAlign: "center",
            fontSize: "0.74rem",
            color: "#9ca3af",
            padding: "12px 24px 24px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <p style={{ margin: 0 }}>© 2026 CDN Fire Engineering (Pvt) Ltd.</p>
          <p style={{ margin: "2px 0 0" }}>All rights reserved.</p>
        </div>
      </div>

      {/* Desktop layout — diagonal clipped panel */}
      <div
        className="hidden sm:flex"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "55%",
          height: "100%",
          backgroundColor: "white",
          clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)",
          zIndex: 20,
          flexDirection: "column",
          boxShadow: "-24px 0 70px rgba(0,0,0,0.3)",
        }}
      >
        {/* Inner form container */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingLeft: "18%",
            paddingRight: "8%",
            paddingTop: 32,
            paddingBottom: 32,
          }}
        >
          <div style={{ width: "100%", maxWidth: 390 }}>

            {/* Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <div style={{ position: "relative", width: 56, height: 48, marginBottom: 12 }}>
                <Image
                  src="/images/cdn-fire-icon.png"
                  alt="CDN FIRE Logo"
                  fill
                  priority
                  sizes="56px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h1
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 900,
                  color: "#111827",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                Welcome Back!
              </h1>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.88rem",
                  marginTop: 6,
                  fontWeight: 400,
                }}
              >
                Sign in to continue to your account
              </p>
            </div>

            {/* Form wrapped in Suspense */}
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-gray-100 rounded-xl" />
                  <div className="h-12 bg-gray-100 rounded-xl" />
                  <div className="h-12 bg-gray-100 rounded-xl" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "0.76rem",
            color: "#9ca3af",
            padding: "14px 32px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <p style={{ margin: 0 }}>© 2026 CDN Fire Engineering (Pvt) Ltd.</p>
          <p style={{ margin: "2px 0 0" }}>All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
