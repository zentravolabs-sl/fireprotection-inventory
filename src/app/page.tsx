"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@cdnfire.lk");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        overflow: "hidden",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#3e0004",
      }}
    >
      {/* ══════════════════════════════════════════════════════
          1. LEFT PANEL — High-Res fire-new2.jpeg Background
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          width: "52%",
          minHeight: "100vh",
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: "#3e0004",
        }}
      >
        {/* New high-resolution fire scene background image */}
        <div style={{ position: "absolute", inset: 0 }}>
          <Image
            src="/images/fire-new2.jpeg"
            alt="CDN Fire Scene Background"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>

        {/* Seamless right-edge gradient fade into dark maroon #3e0004 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "35%",
            height: "100%",
            background: "linear-gradient(to right, transparent 0%, rgba(62,0,4,0.6) 40%, #3e0004 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* White Circular Badge Logo — Upper Left */}
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
            style={{
              objectFit: "contain",
              filter: "brightness(0) invert(1) drop-shadow(0 4px 14px rgba(0,0,0,0.6))",
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          2. FOREGROUND 3D FIRE EXTINGUISHER
      ══════════════════════════════════════════════════════ */}
      <div
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
          style={{
            objectFit: "contain",
            objectPosition: "bottom center",
            filter: "drop-shadow(14px 24px 32px rgba(0,0,0,0.65))",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          3. RIGHT PANEL — White Sign-In Form (Slanted Diagonal Left)
      ══════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "55%",
          height: "100%",
          backgroundColor: "white",
          clipPath: "polygon(14% 0, 100% 0, 100% 100%, 0% 100%)",
          zIndex: 20,
          display: "flex",
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

            {/* Small Red Colored CDN FIRE Logo Icon */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
              <div style={{ position: "relative", width: 56, height: 48, marginBottom: 12 }}>
                <Image
                  src="/images/cdn-fire-icon.png"
                  alt="CDN FIRE Logo"
                  fill
                  priority
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h1
                style={{
                  fontSize: "2.4rem",
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
                  fontSize: "0.92rem",
                  marginTop: 6,
                  fontWeight: 400,
                }}
              >
                Sign in to continue to your account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email Address */}
              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="email"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1f2937", marginBottom: 6 }}
                >
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 14,
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Mail size={18} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    style={{
                      width: "100%",
                      paddingLeft: 44,
                      paddingRight: 16,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 12,
                      fontSize: "0.9rem",
                      color: "#111827",
                      backgroundColor: "white",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#dc2626";
                      e.target.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.12)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="password"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1f2937", marginBottom: 6 }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 14,
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                      width: "100%",
                      paddingLeft: 44,
                      paddingRight: 48,
                      paddingTop: 12,
                      paddingBottom: 12,
                      border: "1.5px solid #e5e7eb",
                      borderRadius: 12,
                      fontSize: "0.9rem",
                      color: "#111827",
                      backgroundColor: "white",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#dc2626";
                      e.target.style.boxShadow = "0 0 0 3px rgba(220,38,38,0.12)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      top: "50%",
                      right: 14,
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#dc2626", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>Remember me</span>
                </label>
                <a
                  href="#forgot-password"
                  onClick={(e) => e.preventDefault()}
                  style={{ fontSize: "0.85rem", fontWeight: 700, color: "#dc2626", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  Forgot Password?
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "13px 24px",
                  backgroundColor: "#dc2626",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "1rem",
                  border: "none",
                  borderRadius: 12,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: "0 6px 20px rgba(220,38,38,0.3)",
                  fontFamily: "inherit",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = "#b91c1c"; }}
                onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.backgroundColor = "#dc2626"; }}
              >
                {isLoading ? (
                  <>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>


          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "#9ca3af",
            padding: "16px 32px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          <p style={{ margin: 0 }}>© 2026 CDN Fire Engineering (Pvt) Ltd.</p>
          <p style={{ margin: "2px 0 0" }}>All rights reserved.</p>
        </div>
      </div>

      {/* Spinner keyframe styling */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
