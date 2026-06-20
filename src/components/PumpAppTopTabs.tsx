"use client";



import { useState, type ReactNode } from "react";

import { FeedbackNotepadPanel } from "@/components/FeedbackNotepadPanel";

import { AdminOverlayPanel } from "@/components/AdminOverlayPanel";

import { AboutGasstationPanel } from "@/components/AboutGasstationPanel";

import { SdkPackagesPanel } from "@/components/SdkPackagesPanel";

import { useAdminFeedbackCount } from "@/hooks/useAdminFeedbackCount";

import { useAdminSession } from "@/hooks/useAdminSession";

import { cn } from "@/lib/utils";



type PumpAppTopTabsProps = {

  disabled?: boolean;

  sdkPanelOpen?: boolean;

  onSdkPanelOpenChange?: (open: boolean) => void;

};



type OpenPanel = "feedback" | "admin" | "about" | null;



export function PumpAppTopTabs({

  disabled = false,

  sdkPanelOpen = false,

  onSdkPanelOpenChange,

}: PumpAppTopTabsProps) {

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const { authenticated } = useAdminSession();

  const messageCount = useAdminFeedbackCount();



  const openFeedback = () => {

    if (disabled) return;

    setOpenPanel("feedback");

  };



  const openAdmin = () => {

    if (disabled) return;

    setOpenPanel("admin");

  };



  const openAbout = () => {

    if (disabled) return;

    setOpenPanel("about");

  };



  return (

    <>

      <nav

        className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-white/10 bg-black/30 p-0.5"

        aria-label="Üst menü"

      >

        <TabButton active={openPanel === "about"} disabled={disabled} onClick={openAbout}>

          Hakkımızda

        </TabButton>

        <TabButton

          active={openPanel === "feedback"}

          disabled={disabled}

          onClick={openFeedback}

        >

          <span className="hidden min-[420px]:inline">İletişim ve geri bildirim</span>

          <span className="min-[420px]:hidden">İletişim</span>

        </TabButton>

        <TabButton

          active={openPanel === "admin"}

          disabled={disabled}

          onClick={openAdmin}

          badge={authenticated && messageCount > 0 ? messageCount : undefined}

        >

          Admin

        </TabButton>

      </nav>



      <AboutGasstationPanel open={openPanel === "about"} onClose={() => setOpenPanel(null)} />

      <FeedbackNotepadPanel open={openPanel === "feedback"} onClose={() => setOpenPanel(null)} />

      <AdminOverlayPanel open={openPanel === "admin"} onClose={() => setOpenPanel(null)} />

      <SdkPackagesPanel

        open={sdkPanelOpen}

        onClose={() => onSdkPanelOpenChange?.(false)}

      />

    </>

  );

}



function TabButton({

  children,

  active,

  disabled,

  onClick,

  badge,

}: {

  children: ReactNode;

  active: boolean;

  disabled: boolean;

  onClick: () => void;

  badge?: number;

}) {

  return (

    <button

      type="button"

      disabled={disabled}

      onClick={onClick}

      className={cn(

        "relative rounded-full px-2.5 py-2 text-[10px] font-semibold tracking-wide transition sm:px-3 sm:py-1.5 sm:text-[11px]",

        active

          ? "bg-white/10 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.15)]"

          : "text-neutral-400 hover:text-neutral-200",

        disabled && "cursor-not-allowed opacity-50",

      )}

    >

      {children}

      {badge !== undefined && badge > 0 ? (

        <span

          className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_8px_rgba(220,38,38,0.5)]"

          aria-label={`${badge} mesaj`}

        >

          {badge > 99 ? "99+" : badge}

        </span>

      ) : null}

    </button>

  );

}

