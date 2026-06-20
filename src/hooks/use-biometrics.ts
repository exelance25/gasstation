"use client";

import { useEffect, useState } from "react";

export function useBiometrics() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "PublicKeyCredential" in window);
  }, []);

  return { supported };
}
