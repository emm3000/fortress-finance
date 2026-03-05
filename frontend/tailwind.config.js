/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FFD700", // Gold
          dark: "#B8860B",
          light: "#FFFACD",
        },
        background: "#0F0F0F",
        surface: "#1A1A1A",
        border: "#2A2A2A",
      },
    },
  },
  plugins: [],
};
