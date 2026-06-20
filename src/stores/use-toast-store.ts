"use client";

import { create } from "zustand";

type ToastStore = {
  message?: string;
  visible: boolean;
  show: (message: string) => void;
  hide: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  show: (message) => {
    set({ message, visible: true });
    setTimeout(() => set({ visible: false }), 2200);
  },
  hide: () => set({ visible: false })
}));
