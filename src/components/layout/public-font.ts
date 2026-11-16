import { Inter_Tight } from "next/font/google";

// Awwwards' UI uses upright Inter Tight. Keep invitation typography independent.
export const publicFont = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  style: "normal",
  variable: "--font-public",
  display: "swap",
});
