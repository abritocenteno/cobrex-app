/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0F",
        surface: "#12121A",
        surface2: "#1A1A26",
        border: "rgba(255,255,255,0.08)",
        accent: "#2563EB",
        "accent-red": "#FF4757",
        "accent-blue": "#47C8FF",
        "accent-purple": "#B847FF",
        "text-primary": "#F0F0F8",
        "text-muted": "#6B6B80",
        green: "#47FF8C",
        orange: "#FF8C47",
      },
      fontFamily: {
        sans: ["DMSans_400Regular"],
        "sans-medium": ["DMSans_500Medium"],
        "sans-semibold": ["DMSans_600SemiBold"],
        "sans-bold": ["DMSans_700Bold"],
        "sans-extrabold": ["DMSans_800ExtraBold"],
        bebas: ["BebasNeue_400Regular"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};
