import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";

export const metadata: Metadata = {
  title: "Champions Calculator",
  description: "Damage calculator built for the Pokémon Champions format.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}