"use client";

import { useAdminSession } from "@/hooks/useAdminSession";
import { adminTr } from "@/i18n/admin-tr";

export function AdminSignIn() {
  const { signIn, signingIn, error, isConnected, adminWallet, address } = useAdminSession();

  const wrongWallet =
    isConnected &&
    adminWallet &&
    address &&
    adminWallet.toLowerCase() !== address.toLowerCase();

  return (
    <div className="w-full max-w-md rounded-xl border border-purple-500/40 bg-neutral-950/90 p-8 text-center">
      <p className="text-lg font-semibold text-purple-200">{adminTr.verifyTitle}</p>
      <p className="mt-2 text-sm text-neutral-400">{adminTr.verifyDetail}</p>
      {adminWallet && (
        <p className="mt-3 text-xs text-neutral-500">
          {adminTr.expectedWallet}: <code className="text-emerald-400">{adminWallet}</code>
        </p>
      )}
      {!isConnected && (
        <p className="mt-4 text-sm text-amber-300">{adminTr.connectFirst}</p>
      )}
      {wrongWallet && <p className="mt-3 text-sm text-amber-300">{adminTr.wrongWallet}</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        disabled={!isConnected || signingIn || wrongWallet}
        onClick={() => void signIn()}
        className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
      >
        {signingIn ? adminTr.signingIn : adminTr.verifyButton}
      </button>
    </div>
  );
}
