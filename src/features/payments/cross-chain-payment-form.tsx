"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPaymentIntent } from "@/payments/payment-intents";
import { pumpStationService } from "@/pumpstation/pumpstation-service";

export function CrossChainPaymentForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("100");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const intent = createPaymentIntent({
      amount: Number(amount),
      currency: "USD",
      recipient: recipient || "0xDemoRecipient",
      sourceChain: "ethereum",
      targetChain: "solana"
    });
    await pumpStationService.submitSpendingIntent({
      intentId: intent.id,
      amount: intent.fiatAmount,
      proofRequired: true
    });
    setLoading(false);
    router.push("/payment-success");
  };

  return (
    <div className="mt-4 space-y-3">
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (USD)" />
      <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient" />
      <Button loading={loading} onClick={submit} className="ripple">
        Send Cross-Chain
      </Button>
    </div>
  );
}
