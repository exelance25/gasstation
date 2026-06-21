"use client";

import { useAdminSession } from "@/hooks/useAdminSession";
import { messages } from "@/i18n/messages";

export function AdminSignIn() {
  const { signIn, signingIn, error, isConnected } = useAdminSession();

  return (
    <div className="w-full max-w-md rounded-xl border border-purple-500/40 bg-neutral-950/90 p-8 text-center">
      <p className="text-lg font-semibold text-purple-200">{messages.admin.verifyTitle}</p>
      <p className="mt-2 text-sm text-neutral-400">{messages.admin.verifyDetail}</p>
      {!isConnected && (
        <p className="mt-4 text-sm text-amber-300">{messages.admin.connectFirst}</p>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        disabled={!isConnected || signingIn}
        onClick={() => void signIn()}
        className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
      >
        {signingIn ? messages.admin.signingIn : messages.admin.verifyButton}
      </button>
    </div>
  );
}
