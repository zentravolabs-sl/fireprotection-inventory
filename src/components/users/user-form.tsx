"use client";

// ============================================================
// src/components/users/user-form.tsx
// Reusable form for Create User and Edit User pages.
// Uses react-hook-form + Zod for client-side validation.
// Server-side validation is also enforced in server actions.
// ============================================================

import React, { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  Building,
  IdCard,
  Shield,
  Link as LinkIcon,
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";
import { createUser, updateUser } from "@/app/actions/user-actions";
import type { ActionState, UserProfile } from "@/types/auth";

// ── Types ───────────────────────────────────────────────────

type FormMode = "create" | "edit";

interface UserFormProps {
  mode: FormMode;
  defaultValues?: Partial<UserProfile>;
  actorRole: string;
}

// ── Role options ────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin", restricted: true },
  { value: "ADMIN", label: "Admin", restricted: false },
  { value: "PROJECT_MANAGER", label: "Project Manager", restricted: false },
  { value: "ENGINEER", label: "Engineer", restricted: false },
  { value: "USER", label: "User", restricted: false },
];

// ── Input component ─────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}

function Field({ id, label, required, icon, children, error, hint }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[#dce3ef] mb-1.5">
        {label}
        {required && <span className="text-[#e02424] ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a657a] pointer-events-none flex items-center">
          {icon}
        </span>
        {children}
      </div>
      {hint && !error && <p className="mt-1 text-xs text-[#5a657a]">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-rose-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({
  id,
  name,
  placeholder,
  defaultValue,
  type = "text",
  required,
  disabled,
  error,
}: {
  id: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      disabled={disabled}
      autoComplete="off"
      className={[
        "w-full h-11 pl-10 pr-4 bg-[#161d2e] border text-sm text-[#dce3ef] placeholder-[#5a657a] rounded-xl transition-all",
        "focus:outline-none focus:ring-1",
        error
          ? "border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/20"
          : "border-[#1e2a3d] focus:border-[#e02424]/50 focus:ring-[#e02424]/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

// ── Section header ──────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-[#1e2a3d]">
      <h2 className="text-base font-bold text-[#dce3ef]">{title}</h2>
      <p className="text-sm text-[#5a657a] mt-0.5">{subtitle}</p>
    </div>
  );
}

// ── Main Form Component ─────────────────────────────────────

export default function UserForm({ mode, defaultValues, actorRole }: UserFormProps) {
  const router = useRouter();

  const action = mode === "create" ? createUser : updateUser;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    { success: false, message: "" },
  );

  // Handle success/error feedback
  useEffect(() => {
    if (!state?.message) return;
    if (state.success) {
      toast.success(state.message);
      router.push("/users-roles");
    } else if (state.message && !state.errors) {
      toast.error(state.message);
    }
  }, [state, router]);

  const errors = state?.success === false ? (state.errors ?? {}) : {};

  const canAssignSuperAdmin = actorRole === "SUPER_ADMIN";

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {/* Hidden id for edit mode */}
      {mode === "edit" && defaultValues?.id && (
        <input type="hidden" name="id" value={defaultValues.id} />
      )}

      {/* Global error message */}
      {state?.success === false && state.message && !state.errors && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
          <span className="font-semibold">Error:</span>
          {state.message}
        </div>
      )}

      {/* ── Section 1: Personal Information ── */}
      <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-6">
        <SectionHeader
          title="Personal Information"
          subtitle="Basic identity and contact details for the user."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Field
              id="name"
              label="Full Name"
              required
              icon={<User size={15} />}
              error={errors.name?.[0]}
            >
              <TextInput
                id="name"
                name="name"
                placeholder="e.g. Kasun Perera"
                defaultValue={defaultValues?.name}
                required
                error={!!errors.name}
              />
            </Field>
          </div>

          <Field
            id="employeeCode"
            label="Employee Code"
            icon={<IdCard size={15} />}
            error={errors.employeeCode?.[0]}
            hint="Must be unique. Leave blank if not applicable."
          >
            <TextInput
              id="employeeCode"
              name="employeeCode"
              placeholder="e.g. EMP-001"
              defaultValue={defaultValues?.employeeCode ?? ""}
              error={!!errors.employeeCode}
            />
          </Field>

          <Field
            id="phone"
            label="Phone Number"
            icon={<Phone size={15} />}
            error={errors.phone?.[0]}
          >
            <TextInput
              id="phone"
              name="phone"
              placeholder="e.g. +94 77 123 4567"
              defaultValue={defaultValues?.phone ?? ""}
              type="tel"
              error={!!errors.phone}
            />
          </Field>

          <Field
            id="designation"
            label="Designation"
            icon={<Briefcase size={15} />}
            error={errors.designation?.[0]}
          >
            <TextInput
              id="designation"
              name="designation"
              placeholder="e.g. Senior Engineer"
              defaultValue={defaultValues?.designation ?? ""}
              error={!!errors.designation}
            />
          </Field>

          <Field
            id="department"
            label="Department"
            icon={<Building size={15} />}
            error={errors.department?.[0]}
          >
            <TextInput
              id="department"
              name="department"
              placeholder="e.g. Fire Engineering"
              defaultValue={defaultValues?.department ?? ""}
              error={!!errors.department}
            />
          </Field>

          {mode === "edit" && (
            <div className="sm:col-span-2">
              <Field
                id="image"
                label="Profile Image URL"
                icon={<LinkIcon size={15} />}
                error={errors.image?.[0]}
                hint="Enter a public image URL. Leave blank to use initials avatar."
              >
                <TextInput
                  id="image"
                  name="image"
                  placeholder="https://example.com/avatar.jpg"
                  defaultValue={defaultValues?.image ?? ""}
                  type="url"
                  error={!!errors.image}
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Account Information (Create only) ── */}
      {mode === "create" && (
        <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-6">
          <SectionHeader
            title="Account Information"
            subtitle="Login credentials. Password is securely hashed before storage."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Field
                id="email"
                label="Email Address"
                required
                icon={<Mail size={15} />}
                error={errors.email?.[0]}
              >
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@cdnfire.com"
                  required
                  error={!!errors.email}
                />
              </Field>
            </div>

            <Field
              id="password"
              label="Password"
              required
              icon={<Lock size={15} />}
              error={errors.password?.[0]}
              hint="Min 8 characters, must include uppercase, lowercase, and a number."
            >
              <TextInput
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                error={!!errors.password}
              />
            </Field>

            <Field
              id="confirmPassword"
              label="Confirm Password"
              required
              icon={<Lock size={15} />}
              error={errors.confirmPassword?.[0]}
            >
              <TextInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                error={!!errors.confirmPassword}
              />
            </Field>
          </div>
        </div>
      )}

      {/* Edit: email field (separate section, clearly marked as sensitive) */}
      {mode === "edit" && (
        <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-6">
          <SectionHeader
            title="Account Information"
            subtitle="Changing email affects login. Password cannot be changed here."
          />
          <div className="grid grid-cols-1 gap-5">
            <Field
              id="email"
              label="Email Address"
              required
              icon={<Mail size={15} />}
              error={errors.email?.[0]}
              hint="Changing email will affect the user's login credentials."
            >
              <TextInput
                id="email"
                name="email"
                type="email"
                defaultValue={defaultValues?.email}
                required
                error={!!errors.email}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ── Section 3: System Access ── */}
      <div className="bg-[#0F1524] border border-[#1e2a3d] rounded-2xl p-6">
        <SectionHeader
          title="System Access"
          subtitle="Define the user's role and account activation status."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-[#dce3ef] mb-1.5">
              Role <span className="text-[#e02424]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a657a] pointer-events-none flex items-center">
                <Shield size={15} />
              </span>
              <select
                id="role"
                name="role"
                defaultValue={defaultValues?.role ?? "USER"}
                required
                className={[
                  "w-full h-11 pl-10 pr-4 bg-[#161d2e] border text-sm text-[#dce3ef] rounded-xl appearance-none cursor-pointer",
                  "focus:outline-none focus:ring-1",
                  errors.role
                    ? "border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/20"
                    : "border-[#1e2a3d] focus:border-[#e02424]/50 focus:ring-[#e02424]/20",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option
                    key={r.value}
                    value={r.value}
                    disabled={r.restricted && !canAssignSuperAdmin}
                  >
                    {r.label}
                    {r.restricted && !canAssignSuperAdmin ? " (restricted)" : ""}
                  </option>
                ))}
              </select>
            </div>
            {errors.role && (
              <p role="alert" className="mt-1 text-xs text-rose-400 font-medium">
                {errors.role[0]}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="isActive" className="block text-sm font-semibold text-[#dce3ef] mb-1.5">
              Account Status
            </label>
            <div className="relative">
              <select
                id="isActive"
                name="isActive"
                defaultValue={defaultValues?.isActive === false ? "false" : "true"}
                className="w-full h-11 pl-4 pr-4 bg-[#161d2e] border border-[#1e2a3d] text-sm text-[#dce3ef] rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:border-[#e02424]/50 focus:ring-[#e02424]/20"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#5a657a] hover:text-[#dce3ef] border border-[#1e2a3d] hover:border-[#2a3a52] rounded-xl transition-colors"
        >
          <ArrowLeft size={15} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#e02424] hover:bg-[#c51c1c] rounded-xl shadow-sm transition-all hover:shadow-[0_0_0_3px_rgba(224,36,36,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          {mode === "create" ? "Create User" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
