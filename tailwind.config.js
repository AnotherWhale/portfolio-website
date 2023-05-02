/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  theme: {
    colors: {
      muswhite: "#DBC6DA",
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#DB924B",

          secondary: "#263E3F",

          accent: "#10576D",

          neutral: "#120C12",

          "base-100": "#20161F",

          info: "#8DCAC1",

          success: "#9DB787",

          warning: "#FFD25F",

          error: "#FC9581",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
};
