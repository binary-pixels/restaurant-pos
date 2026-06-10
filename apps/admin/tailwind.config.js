/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pos: {
          primary: "#2563eb",
          available: "#22c55e",
          occupied: "#ef4444",
          reserved: "#3b82f6",
          cleaning: "#eab308",
          disabled: "#9ca3af",
        },
      },
    },
  },
  plugins: [],
};
