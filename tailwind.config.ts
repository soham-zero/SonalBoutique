import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        boutique: {
          cream: "#FAF9F6",
          creamDark: "#F0EBE1",
          rose: "#DDA7A5",
          roseLight: "#E8C8C7",
          roseDark: "#C4827F",
          charcoal: "#333333",
          charcoalLight: "#5A5A5A",
          border: "#E2DCD0",
          // Semantic action colors
          emerald: "#10B981",
          emeraldLight: "#D1FAE5",
          amber: "#F59E0B",
          amberLight: "#FEF3C7",
          teal: "#0D9488",
          tealLight: "#CCFBF1",
          indigo: "#6366F1",
          indigoLight: "#E0E7FF",
          ruby: "#E11D48",
          rubyLight: "#FFE4E6",
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'glow-rose': '0 0 0 3px rgba(196, 130, 127, 0.20)',
        'glow-emerald': '0 0 0 3px rgba(16, 185, 129, 0.20)',
        'card': '0 2px 8px -1px rgba(0,0,0,0.08), 0 1px 3px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 28px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-down': { from: { opacity: '0', transform: 'translateY(-8px) scaleY(0.97)' }, to: { opacity: '1', transform: 'translateY(0) scaleY(1)' } },
        'modal-in': { from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' }, to: { opacity: '1', transform: 'scale(1) translateY(0)' } },
        'pulse-soft': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.65' } },
      },
      animation: {
        'fade-in': 'fade-in 0.22s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'modal-in': 'modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
