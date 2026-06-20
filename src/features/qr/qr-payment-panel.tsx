"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQrPayload } from "@/qr/qr-service";
import { useToastStore } from "@/stores/use-toast-store";

export function QrPaymentPanel() {
  const [payload, setPayload] = useState<string>();
  const showToast = useToastStore((s) => s.show);

  return (
    <div className="mt-4 space-y-4 text-center">
      <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-3xl bg-white/5">
        <QrCode size={64} className="text-muted" />
      </div>
      <Button
        className="ripple"
        onClick={() => {
          const next = generateQrPayload({ amount: 50, merchant: "ONEBALANCE Merchant" });
          setPayload(next);
          showToast("QR generated — scan to pay");
        }}
      >
        Generate Payment QR
      </Button>
      {payload && <p className="break-all text-xs text-muted">{payload}</p>}
    </div>
  );
}
