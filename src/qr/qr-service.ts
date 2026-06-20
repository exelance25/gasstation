export const qrService = {
  parse(value: string) {
    return { raw: value, isValid: value.startsWith("onebalance:") };
  }
};

export function generateQrPayload(input: { amount: number; merchant: string }) {
  return `onebalance:pay?amount=${input.amount}&merchant=${encodeURIComponent(input.merchant)}&ts=${Date.now()}`;
}
