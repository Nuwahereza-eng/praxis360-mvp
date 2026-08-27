import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Praxis360 design system tokens (from DESIGN.md)
        surface: "#faf9fd",
        "surface-dim": "#dad9dd",
        "surface-bright": "#faf9fd",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f3f7",
        "surface-container": "#efedf1",
        "surface-container-high": "#e9e7eb",
        "surface-container-highest": "#e3e2e6",
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#43474e",
        outline: "#74777f",
        "outline-variant": "#c4c6cf",
        primary: "#002045",
        "on-primary": "#ffffff",
        "primary-container": "#1a365d",
        "on-primary-container": "#d6e3ff",
        "primary-fixed": "#d6e3ff",
        "primary-fixed-dim": "#adc7f7",
        secondary: "#13696a",
        "on-secondary": "#ffffff",
        "secondary-container": "#a2eded",
        "on-secondary-container": "#00363a",
        tertiary: "#122234",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#28374a",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        success: "#0f766e",
        "success-container": "#ccfbf1",
        warning: "#b45309",
        "warning-container": "#fef3c7",
        info: "#1d4ed8",
        "info-container": "#dbeafe",
      },
      fontFamily: {
        display: ["Hanken Grotesk", "system-ui", "sans-serif"],
        body: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
