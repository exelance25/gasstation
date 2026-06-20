"use client";



import { useEffect, useRef, useState } from "react";

import type { DepotAssetId } from "@/config/depot-assets";

import { getDepotAsset } from "@/config/depot-assets";

import {

  getDeliveryAssetCatalog,

  isDeliveryAssetSelectable,

} from "@/config/gas-features";

import { AssetIcon } from "@/components/AssetIcon";

import { getDeliveryNetworkLabel } from "@/lib/explorer-urls";

import { cn } from "@/lib/utils";



type DepotAssetSelectorProps = {

  selected: DepotAssetId;

  onSelect: (id: DepotAssetId) => void;

  disabled?: boolean;

};



export function DepotAssetSelector({

  selected,

  onSelect,

  disabled,

}: DepotAssetSelectorProps) {

  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const options = getDeliveryAssetCatalog();

  const current = getDepotAsset(selected);



  useEffect(() => {

    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {

      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {

        setOpen(false);

      }

    };

    const onKeyDown = (e: KeyboardEvent) => {

      if (e.key === "Escape") setOpen(false);

    };

    document.addEventListener("mousedown", onPointerDown);

    document.addEventListener("keydown", onKeyDown);

    return () => {

      document.removeEventListener("mousedown", onPointerDown);

      document.removeEventListener("keydown", onKeyDown);

    };

  }, [open]);



  const handleSelect = (id: DepotAssetId) => {

    if (!isDeliveryAssetSelectable(id)) return;

    onSelect(id);

    setOpen(false);

  };



  return (

    <div ref={rootRef} className="relative space-y-2">

      <div>

        <p className="text-xs font-semibold text-amber-100/90">Gas teslimi</p>

        <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">

          Hangi ağa yakıt göndereceğinizi seçin

        </p>

      </div>



      <button

        type="button"

        disabled={disabled}

        onClick={() => setOpen((v) => !v)}

        aria-expanded={open}

        aria-haspopup="listbox"

        className={cn(

          "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition",

          open

            ? "border-amber-400/35 bg-gradient-to-br from-amber-950/40 to-neutral-950/80 shadow-[0_0_24px_rgba(251,191,36,0.08)]"

            : "border-white/10 bg-white/[0.04] hover:border-amber-400/20 hover:bg-white/[0.06]",

          disabled && "cursor-not-allowed opacity-50",

        )}

      >

        <div className="min-w-0 flex items-center gap-3">

          <AssetIcon id={selected} active className="h-9 w-9" />

          <div>

            <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">

              Seçili ağ

            </p>

            <p className="mt-0.5 text-base font-bold text-white">{current.label}</p>

            <p className="mt-0.5 text-xs text-amber-200/70">

              {getDeliveryNetworkLabel(selected)}

            </p>

          </div>

        </div>

        <span

          className={cn(

            "shrink-0 text-lg text-amber-300/80 transition-transform",

            open && "rotate-180",

          )}

          aria-hidden

        >

          ▾

        </span>

      </button>



      {open && (

        <div

          role="listbox"

          aria-label="Gas teslim ağı"

          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[110] max-h-[min(420px,60vh)] overflow-y-auto rounded-2xl border border-amber-400/20 bg-neutral-950/95 shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl"

        >

          <ul className="flex flex-col gap-0.5 p-2">

            {options.map((asset) => {

              const active = selected === asset.id;

              const selectable = isDeliveryAssetSelectable(asset.id);

              return (

                <li key={asset.id}>

                  <button

                    type="button"

                    role="option"

                    aria-selected={active}

                    aria-disabled={!selectable}

                    disabled={disabled || !selectable}

                    onClick={() => handleSelect(asset.id)}

                    className={cn(

                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",

                      !selectable && "cursor-not-allowed opacity-55",

                      selectable && active

                        ? "border border-amber-400/40 bg-amber-950/50"

                        : selectable

                          ? "border border-transparent hover:border-white/10 hover:bg-white/[0.05]"

                          : "border border-transparent bg-white/[0.02]",

                    )}

                  >

                    <AssetIcon id={asset.id} active={selectable} className="h-9 w-9" />

                    <div className="min-w-0 flex-1">

                      <p

                        className={cn(

                          "text-sm font-bold",

                          active ? "text-amber-200" : "text-white",

                        )}

                      >

                        {asset.label}

                      </p>

                      <p className="text-[11px] text-neutral-400">

                        {getDeliveryNetworkLabel(asset.id)}

                      </p>

                      {!selectable && (

                        <p className="mt-0.5 text-[10px] font-medium text-amber-400/90">Yakında</p>

                      )}

                    </div>

                    {active && selectable && (

                      <span className="text-xs font-semibold text-amber-400/90">✓</span>

                    )}

                  </button>

                </li>

              );

            })}

          </ul>

        </div>

      )}

    </div>

  );

}


