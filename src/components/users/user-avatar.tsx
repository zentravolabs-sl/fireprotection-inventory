// ============================================================
// src/components/users/user-avatar.tsx
// Displays a user's profile image, or initials fallback.
// ============================================================

import React from "react";

interface UserAvatarProps {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-rose-600",
    "bg-orange-600",
    "bg-amber-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-blue-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-pink-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function UserAvatar({ name, image, size = "md" }: UserAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ring-2 ring-[#1e2a3d]`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-[#1e2a3d]`}
    >
      {initials}
    </div>
  );
}
