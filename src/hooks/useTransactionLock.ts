"use client";

import { useCallback, useRef, useState } from "react";

/**
 * İşlem sırasında arayüzü kilitler — çift tıklama / mükerrer işlem önlenir.
 * Ref tabanlı kilit: stale closure kaynaklı takılmaları engeller.
 */
export function useTransactionLock() {
  const lockedRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  const lock = useCallback(() => {
    lockedRef.current = true;
    setIsLocked(true);
  }, []);

  const unlock = useCallback(() => {
    lockedRef.current = false;
    setIsLocked(false);
  }, []);

  const runLocked = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      if (lockedRef.current) {
        throw new Error("İşlem zaten devam ediyor");
      }
      lock();
      try {
        return await fn();
      } finally {
        unlock();
      }
    },
    [lock, unlock],
  );

  return { isLocked, lock, unlock, runLocked };
}
