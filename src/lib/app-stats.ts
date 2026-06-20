/** Gösterim amaçlı protokol metrikleri — landing + pompa üst bar */
export const APP_STATS = {
  totalUsers: 248_913,
  totalVolumeUsd: 4_200_000,
} as const;

export const HOW_TO_USE_STEPS = [
  {
    step: 1,
    title: "Cüzdanını bağla",
    text: "EVM veya Solana cüzdanını bağla — hesap açmana gerek yok.",
  },
  {
    step: 2,
    title: "Paket ve ağ seç",
    text: "USDC hangi ağdan kesilecekse onu seç, gas paketini belirle.",
  },
  {
    step: 3,
    title: "Hedef adres + Ateşle",
    text: "Gas gidecek adresi gir, onayla — native token anında teslim edilir.",
  },
] as const;
