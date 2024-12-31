import { nextui } from "@nextui-org/react";
import defaultTheme from "tailwindcss/defaultTheme";
import { themes } from "./src/config/tailwind-nextui-theme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    fontFamily: {
      sans: ["var(--vscode-font-family)", ...defaultTheme.fontFamily.sans],
      mono: [
        "var(--vscode-editor-font-family)",
        ...defaultTheme.fontFamily.mono,
      ],
    },
  },
  // next-ui only works with class, and only with .dark class
  darkMode: ["class", "body.dark"],
  // TODO: use this instead when nextui supports it
  // darkMode: ['class', 'body[data-vscode-theme-kind="vscode-dark"],body[data-vscode-theme-kind="vscode-high-contrast"]'],
  plugins: [nextui({ themes })],
};
