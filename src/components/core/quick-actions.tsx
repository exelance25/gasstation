"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SendDialog } from "@/components/core/send-dialog";
import { WalletManageSheet } from "@/components/core/wallet-manage-sheet";

export function QuickActions({ onOpenConnect }: { onOpenConnect: () => void }) {
  const { t } = useTranslation();
  const [sendOpen, setSendOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <>
      <section className="flex flex-col gap-3">
        <Button
          className="embossed h-14 border-0 bg-monad-500 text-lg font-bold text-white shadow-monad hover:bg-monad-600"
          onClick={() => setSendOpen(true)}
        >
          {t("send")}
        </Button>
        <Button
          className="embossed h-12 border-0 bg-white/55 text-base font-semibold text-monad-ink hover:bg-white/75"
          onClick={() => setManageOpen(true)}
        >
          <Wallet className="mr-2 inline" size={18} />
          {t("manageWallets")}
        </Button>
      </section>

      <SendDialog open={sendOpen} onOpenChange={setSendOpen} />
      <WalletManageSheet open={manageOpen} onOpenChange={setManageOpen} onConnect={onOpenConnect} />
    </>
  );
}
