"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import type { GasDeliveryAsset } from "@/config/depot-assets";

import type { PackageQuote } from "@/lib/pricing";

import { calculatePackageQuoteFromDelivery } from "@/lib/pricing";

import { isValidDeliveryAmount } from "@/lib/pricing";

import { STUB_ORACLE_PRICES } from "@/lib/oracle/stub-prices";



type OracleApiQuote = {

  packageUsd: number;

  deliveryAsset: string;

  protocolFeeUsd: number;

  networkFeeUsd: number;

  netUsdForGas: number;

  treasuryRetainedUsd?: number;

  estimatedGasAmount: number;

  contractGasWei: string;

  ethPrice: number;

  basePrice: number;

  monPrice: number;

  solPrice: number;

  oracle?: {

    source: string;

    updatedAt: string;

    roundId: string;

    ETH_Price?: number;

    BASE_Price?: number;

    MON_Price?: number;

    SOL_Price?: number;

  };

};



const POLL_MS = 8_000;



function toPackageQuote(raw: OracleApiQuote): PackageQuote {

  return {

    packageUsd: raw.packageUsd,

    protocolFeeUsd: raw.protocolFeeUsd,

    networkFeeUsd: raw.networkFeeUsd,

    netUsdForGas: raw.netUsdForGas,

    treasuryRetainedUsd: raw.treasuryRetainedUsd,

    deliveryAsset: raw.deliveryAsset as PackageQuote["deliveryAsset"],

    estimatedGasAmount: raw.estimatedGasAmount,

    contractGasWei: BigInt(raw.contractGasWei || "0"),

    ethPrice: raw.ethPrice,

    basePrice: raw.basePrice ?? raw.ethPrice,

    monPrice: raw.monPrice,

    solPrice: raw.solPrice ?? 145,

  };

}



function applyQuoteState(

  data: OracleApiQuote,

  setters: {

    setQuote: (q: PackageQuote) => void;

    setOracleSource: (s: string) => void;

    setLastUpdated: (s: string) => void;

    setMarketPrices: (s: string) => void;

  },

) {

  setters.setQuote(toPackageQuote(data));

  setters.setOracleSource(data.oracle?.source ?? "oracle");

  setters.setLastUpdated(data.oracle?.updatedAt ?? new Date().toISOString());

  const o = data.oracle;

  if (o?.ETH_Price) {

    setters.setMarketPrices(

      `ETH $${o.ETH_Price.toFixed(0)} · BASE $${(o.BASE_Price ?? o.ETH_Price).toFixed(0)} · MON $${o.MON_Price?.toFixed(4) ?? "—"} · SOL $${o.SOL_Price?.toFixed(0) ?? "—"}`,

    );

  } else {

    setters.setMarketPrices(

      `ETH $${data.ethPrice.toFixed(0)} · BASE $${(data.basePrice ?? data.ethPrice).toFixed(0)} · MON $${data.monPrice.toFixed(4)} · SOL $${data.solPrice.toFixed(0)}`,

    );

  }

}



async function loadClientStubQuote(

  deliveryAmount: number,

  asset: GasDeliveryAsset,

): Promise<OracleApiQuote> {

  const quote = await calculatePackageQuoteFromDelivery(

    deliveryAmount,

    asset,

    STUB_ORACLE_PRICES,

  );

  return {

    packageUsd: quote.packageUsd,

    deliveryAsset: quote.deliveryAsset,

    protocolFeeUsd: quote.protocolFeeUsd,

    networkFeeUsd: quote.networkFeeUsd,

    netUsdForGas: quote.netUsdForGas,

    treasuryRetainedUsd: quote.treasuryRetainedUsd,

    estimatedGasAmount: quote.estimatedGasAmount,

    contractGasWei: quote.contractGasWei.toString(),

    ethPrice: quote.ethPrice,

    basePrice: quote.basePrice,

    monPrice: quote.monPrice,

    solPrice: quote.solPrice,

    oracle: {

      source: "stub-local",

      updatedAt: new Date().toISOString(),

      roundId: `local-${Date.now()}`,

      ETH_Price: quote.ethPrice,

      BASE_Price: quote.basePrice,

      MON_Price: quote.monPrice,

      SOL_Price: quote.solPrice,

    },

  };

}



/** Canlı oracle — anında yerel tahmin, ardından sunucu fiyatı */

export function useOracleQuote(

  deliveryAmount: number | null,

  asset: GasDeliveryAsset,

) {

  const [quote, setQuote] = useState<PackageQuote | null>(null);

  const [oracleSource, setOracleSource] = useState<string | null>(null);

  const [marketPrices, setMarketPrices] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const requestIdRef = useRef(0);



  const refresh = useCallback(async () => {

    const setters = { setQuote, setOracleSource, setLastUpdated, setMarketPrices };



    if (

      deliveryAmount === null ||

      !Number.isFinite(deliveryAmount) ||

      !isValidDeliveryAmount(deliveryAmount, asset)

    ) {

      setQuote(null);

      setLoading(false);

      setRefreshing(false);

      return;

    }



    const requestId = ++requestIdRef.current;

    setRefreshing(true);



    try {

      const res = await fetch(

        `/api/oracle/quote?amount=${deliveryAmount}&asset=${asset}`,

        { cache: "no-store" },

      );

      if (requestId !== requestIdRef.current) return;

      if (res.ok) {

        const data = (await res.json()) as OracleApiQuote;

        applyQuoteState(data, setters);

        setLoading(false);

        setRefreshing(false);

        return;

      }

    } catch {

      /* ağ / dev sunucu — yerel stub */

    }



    if (requestId !== requestIdRef.current) return;

    try {

      const fallback = await loadClientStubQuote(deliveryAmount, asset);

      applyQuoteState(fallback, setters);

    } catch {

      setQuote(null);

    }



    setLoading(false);

    setRefreshing(false);

  }, [deliveryAmount, asset]);



  useEffect(() => {

    if (

      deliveryAmount === null ||

      !Number.isFinite(deliveryAmount) ||

      !isValidDeliveryAmount(deliveryAmount, asset)

    ) {

      setQuote(null);

      setLoading(false);

      setRefreshing(false);

      return;

    }



    let cancelled = false;

    setLoading(true);

    void loadClientStubQuote(deliveryAmount, asset).then((stub) => {

      if (cancelled) return;

      applyQuoteState(stub, {

        setQuote,

        setOracleSource,

        setLastUpdated,

        setMarketPrices,

      });

      setLoading(false);

    });



    void refresh();

    const id = setInterval(() => void refresh(), POLL_MS);

    return () => {

      cancelled = true;

      clearInterval(id);

    };

  }, [deliveryAmount, asset, refresh]);



  return { quote, loading, refreshing, oracleSource, marketPrices, lastUpdated, refresh };

}


