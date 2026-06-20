"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { operationsMenuItems } from "@/constants/operations-menu";
import { useAppStore } from "@/stores/use-app-store";
import { useToastStore } from "@/stores/use-toast-store";
import { cn } from "@/lib/utils";

export function OperationsMenu({ trigger }: { trigger: React.ReactNode }) {
  const locale = useAppStore((s) => s.locale);
  const showToast = useToastStore((s) => s.show);
  const comingSoon = locale === "tr" ? "YAKINDA" : "COMING SOON";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="glass z-50 w-72 rounded-3xl p-3 shadow-glass"
        >
          <p className="mb-2 px-2 text-xs font-medium text-muted">
            {locale === "tr" ? "Islemler Menusu" : "Operations Menu"}
          </p>
          {operationsMenuItems.map((item) => {
            const Icon = item.icon;
            const label = locale === "tr" ? item.labelTr : item.labelEn;
            return (
              <DropdownMenu.Item
                key={item.id}
                className="outline-none"
                onSelect={(e) => {
                  if (item.enabled === false) {
                    e.preventDefault();
                    showToast(comingSoon);
                  }
                }}
              >
                <div
                  className={cn(
                    "tap-fast mb-1 flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5",
                    item.enabled !== false ? "hover:bg-primary/10" : "opacity-55"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    {item.enabled === false && <p className="text-[10px] text-muted">{comingSoon}</p>}
                  </div>
                </div>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
