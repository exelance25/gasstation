"use client";

/** Server redirect sets HttpOnly cookie + opens app — avoids client cookie races */
export function enterApp(redirect = "/"): void {
  const path = redirect.startsWith("/") ? redirect : "/";
  window.location.href = `/api/auth/enter?redirect=${encodeURIComponent(path)}`;
}
