"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LOCK_DURATION_SEC = 10;

/**
 * Transfer onayında fiyatı 10 sn kilitler (Locked Rate).
 */
export function useRateLock() {
  const [lockedRate, setLockedRate] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearLock = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setLockedRate(null);
    setSecondsRemaining(0);
  }, []);

  const lockRate = useCallback(
    (rate: number) => {
      clearLock();
      setLockedRate(rate);
      setSecondsRemaining(LOCK_DURATION_SEC);

      let remaining = LOCK_DURATION_SEC;
      intervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearLock();
        } else {
          setSecondsRemaining(remaining);
        }
      }, 1000);
    },
    [clearLock],
  );

  useEffect(() => () => clearLock(), [clearLock]);

  return {
    lockedRate,
    isRateLocked: lockedRate !== null && secondsRemaining > 0,
    secondsRemaining,
    lockRate,
    clearLock,
  };
}
