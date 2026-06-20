import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "#0D0F12",
        landing: {
          bg: "#030712",
          card: "rgba(255,255,255,0.04)",
        },
        neon: {
          purple: "#8A2BE2",
          red: "#FF3366",
          green: "#39FF14",
          "accent-purple": "#A855F7",
          "accent-green": "#10B981",
        },
      },
      boxShadow: {
        "neon-purple":
          "0 0 20px rgba(138, 43, 226, 0.5), 0 0 40px rgba(138, 43, 226, 0.25)",
        "neon-red": "0 0 16px rgba(255, 51, 102, 0.6)",
      },
      animation: {
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
