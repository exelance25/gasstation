"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createOrder,
  getOrderStatus,
  type CreateOrderPayload,
  type MarketplaceOrder,
  type OrderStatusResponse,
} from "@/lib/marketplace/client";

export function useMarketplaceOrder(orderId?: string) {
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [status, setStatus] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orderId) return;
    try {
      const s = await getOrderStatus(orderId);
      setStatus(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Durum alınamadı");
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    void refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [orderId, refresh]);

  const submit = useCallback(async (payload: CreateOrderPayload) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createOrder(payload);
      setOrder(created);
      return created;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sipariş oluşturulamadı";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { order, status, loading, error, submit, refresh };
}
