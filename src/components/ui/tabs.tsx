"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} className="w-full">
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.List
      className={cn("grid w-full grid-cols-2 gap-2 rounded-2xl bg-card p-1", className)}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "tap-fast rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition",
        "data-[state=active]:bg-primary-gradient data-[state=active]:text-white"
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Content value={value} className="mt-4 outline-none">
      {children}
    </TabsPrimitive.Content>
  );
}
