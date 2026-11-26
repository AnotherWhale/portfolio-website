/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  daisyui: {
    themes: [{
      portfolio: {
        primary: "#FFBF73",
        "primary-content": "#171B25",
        secondary: "#C1C9D8",
        accent: "#8DCAC1",
        neutral: "#263043",
        "neutral-content": "#F3F5F8",
        "base-100": "#171B25",
        "base-200": "#263043",
        "base-300": "#3D475C",
        "base-content": "#F3F5F8",
        info: "#8DCAC1",
        success: "#8DCAC1",
        warning: "#FFD25F",
        error: "#FFACA9",
        "color-scheme": "dark",
      },
    }],
  },
  plugins: [require("daisyui")],
};
