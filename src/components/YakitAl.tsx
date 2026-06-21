"use client";

import { useState } from "react";
import { WalletContentPicker } from "@/components/WalletContentPicker";
import { DepositWalletConnect } from "@/components/DepositWalletConnect";
import { DepotAssetSelector } from "@/components/DepotAssetSelector";
import { TargetAddressInput } from "@/components/TargetAddressInput";
import { DesiredAmountInput } from "@/components/DesiredAmountInput";
import { PumpGasButton } from "@/components/PumpGasButton";
import { PumpActionStatus } from "@/components/PumpActionStatus";
import { PumpFlowOverlay } from "@/components/PumpFlowOverlay";
import { PumpPrepareBanner } from "@/components/PumpPrepareBanner";
import { GasModeSwitch } from "@/components/GasModeSwitch";
import { AutoFeeQuotePanel } from "@/components/AutoFeeQuotePanel";
import { useGasPump } from "@/hooks/useGasPump";
import { useGasMode } from "@/hooks/useGasMode";
import { isAutoFeeEnabled } from "@/config/client-env";
import { useWalletContext } from "@/providers/WalletContext";
import { DEPOSIT_USDC_HINT } from "@/lib/deposit-networks";
import { PumpWelcomeBanner } from "@/components/PumpWelcomeBanner";
import { PumpUserCounter } from "@/components/PumpUserCounter";
import { PumpAppTopTabs } from "@/components/PumpAppTopTabs";
import { GasStationLogo } from "@/components/GasStationLogo";
import { OperatorTankBanner } from "@/components/OperatorTankBanner";

export function YakitAl() {
  const [sdkPanelOpen, setSdkPanelOpen] = useState(false);
  const {
    desiredAmountInput,
    setDesiredAmountInput,
    amountInvalidHint,
    selectedAmount,
    balanceWarning,
    selectedAsset,
    setSelectedAsset,
    targetAddress,
    setTargetAddress,
    selectedDepositKey,
    setSelectedDepositKey,
    allDepositNetworks,
    allPaymentAssets,
    displayAssets,
    spendableAssets,
    usdcScanLoading,
    anyConnected,
    selectedChainUsdc,
    depositChainName,
    depositTarget,
    quote,
    quoteLoading,
    oracleSource,
    marketPrices,
    lastUpdated,
    isLoading,
    isLocked,
    handlePrimaryAction,
    actionMode,
    pumpButtonBlockReason,
    pumpBlockDetail,
    pumpFlow,
    clearPumpResult,
    isPreparing,
    prepareMessage,
    isTargetMismatch,
    autoFeeQuote,
    autoQuoteLoading,
    autoFeePath,
    isAutoFeeEnabled: autoFeeOn,
    selectedPaymentUsd,
    priceSnapshot,
  } = useGasPump();

  const { mode } = useGasMode();
  const showAutoPanel = mode === "automatic" && isAutoFeeEnabled();

  const { evmConnected, solanaConnected, evmAddress } = useWalletContext();
  const busy = isLoading || isLocked;

  return (
    <div className="relative z-10 w-full max-w-full px-1 sm:px-3">
      <PumpFlowOverlay
        flow={pumpFlow}
        deliveryAsset={selectedAsset}
        onDismiss={clearPumpResult}
      />
      <div className="relative space-y-3 p-1.5 sm:space-y-4 sm:p-3">
        <header className="flex flex-col items-stretch gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <GasStationLogo className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
              <h1 className="truncate bg-gradient-to-r from-emerald-400 via-white to-purple-400 bg-clip-text text-base font-bold tracking-[0.08em] text-transparent drop-shadow-[0_0_24px_rgba(16,185,129,0.25)] sm:text-xl lg:text-2xl">
                GASSTATION
              </h1>
            </div>
            <div className="sm:hidden">
              <GasModeSwitch
                disabled={busy}
                onOpenSdkPackages={() => setSdkPanelOpen(true)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <PumpAppTopTabs
              disabled={busy}
              sdkPanelOpen={sdkPanelOpen}
              onSdkPanelOpenChange={setSdkPanelOpen}
            />
            <PumpUserCounter />
            <div className="hidden sm:block">
              <GasModeSwitch
                disabled={busy}
                onOpenSdkPackages={() => setSdkPanelOpen(true)}
              />
            </div>
          </div>
        </header>

        <PumpWelcomeBanner connected={anyConnected} />

        {oracleSource && (
          <p className="truncate text-center text-[9px] text-neutral-600/70 sm:text-[10px]">
            Oracle: {oracleSource}
            {marketPrices ? ` · ${marketPrices}` : ""}
            {lastUpdated ? ` · ${new Date(lastUpdated).toLocaleTimeString("tr-TR")}` : ""}
            {quoteLoading ? " · …" : ""}
          </p>
        )}

        <div className="grid grid-cols-1 items-start gap-3 overflow-visible sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Sol sütun — cüzdan + ödeme kaynağı */}
          <div className="relative z-30 flex flex-col gap-3 overflow-visible">
            <DepositWalletConnect
              evmConnected={evmConnected}
              solanaConnected={solanaConnected}
              disabled={busy}
            />
            {anyConnected && (
              <WalletContentPicker
                assets={
                  allDepositNetworks.length > 0
                    ? allDepositNetworks
                    : displayAssets.length > 0
                      ? displayAssets
                      : spendableAssets
                }
                selectedKey={selectedDepositKey}
                onSelect={setSelectedDepositKey}
                isLoading={usdcScanLoading}
                disabled={busy}
                selectedPackageUsd={showAutoPanel ? undefined : selectedAmount}
                paymentPrices={priceSnapshot}
                showWhenEmpty
              />
            )}
            {!anyConnected && (
              <p className="text-center text-[10px] text-neutral-500">{DEPOSIT_USDC_HINT}</p>
            )}
          </div>

          {/* Orta — gas teslim ağı (açılır liste) */}
          <div className="relative z-20 overflow-visible">
            <DepotAssetSelector
              selected={selectedAsset}
              onSelect={setSelectedAsset}
              disabled={busy}
            />
            <OperatorTankBanner deliveryAsset={selectedAsset} />
          </div>

          {/* Sağ — paket tutarı veya otomatik quote */}
          <div className="[&_.gap-3]:gap-2 [&_.p-4]:p-3 [&_.py-3]:py-2.5 [&_.text-2xl]:text-xl">
            {showAutoPanel ? (
              <>
                <DesiredAmountInput
                  value={desiredAmountInput}
                  onChange={setDesiredAmountInput}
                  deliveryAsset={selectedAsset}
                  quote={quote}
                  disabled={busy}
                  balanceWarning={balanceWarning}
                  invalidHint={amountInvalidHint}
                />
                <AutoFeeQuotePanel
                quote={autoFeeQuote}
                loading={autoQuoteLoading}
                depositChainName={depositChainName}
                path={autoFeePath}
                packageUsd={selectedAmount}
              />
              </>
            ) : (
              <DesiredAmountInput
                value={desiredAmountInput}
                onChange={setDesiredAmountInput}
                deliveryAsset={selectedAsset}
                quote={quote}
                disabled={busy}
                balanceWarning={balanceWarning}
                invalidHint={amountInvalidHint}
              />
            )}
            {anyConnected && depositChainName !== "—" && !showAutoPanel && depositTarget && (
              <p className="mt-2 text-center text-[10px] text-neutral-600">
                Ödeme: <span className="text-emerald-400/90">{depositChainName}</span>
                {" · "}
                Seçili bakiye:{" "}
                <span className="text-emerald-300/90">
                  {depositTarget.paySymbol === "USDC"
                    ? selectedChainUsdc.toFixed(2)
                    : selectedPaymentUsd.toFixed(2)}{" "}
                  USD ≈ {depositTarget.paySymbol}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Alt — hedef + durum + ateşle */}
        <div className="relative mx-auto w-full max-w-xl space-y-2 pb-1 sm:space-y-2.5 sm:pb-0 [&_input]:min-h-[44px] [&_input]:py-2.5">
          <TargetAddressInput
            value={targetAddress}
            onChange={setTargetAddress}
            deliveryAsset={selectedAsset}
            disabled={busy}
            ownWalletAddress={evmAddress}
          />
          <PumpPrepareBanner
            visible={isPreparing && !busy && pumpFlow.phase !== "success" && pumpFlow.phase !== "error" && pumpFlow.phase !== "fueling"}
            message={prepareMessage}
          />
          <PumpGasButton
            actionMode={actionMode}
            isPumping={isLoading}
            isLocked={isLocked}
            blockReason={busy ? "pumping" : pumpButtonBlockReason}
            blockDetail={pumpBlockDetail}
            onPrimaryAction={handlePrimaryAction}
            locked={isTargetMismatch}
          />
          {!busy && pumpFlow.phase === "idle" && (
            <PumpActionStatus
              blockReason={pumpButtonBlockReason}
              blockDetail={pumpBlockDetail}
              flow={pumpFlow}
              busy={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
