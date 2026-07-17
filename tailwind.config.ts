import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2350",
        brand: "#6258e8",
        lavender: "#f2f0ff",
      },
      boxShadow: { card: "0 10px 30px rgba(67, 61, 135, .10)" },
    },
  },
  plugins: [],
} satisfies Config;
