import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { BOOT_SCRIPT } from "@/lib/app/settings";
import ServiceWorkerRegister from "@/components/shell/ServiceWorkerRegister";

// Same value next.config.ts exposes; read directly here so this server
// component doesn't pull the whole Pokémon data layer in just for a prefix.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://fizzeydev.github.io";
const TITLE = "Champions Tools";
const DESCRIPTION =
  "Damage calculator, Pokédex, speed tiers, advanced search and team tools for Pokémon Champions. Fan-made.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: { apple: `${BASE_PATH}/icons/icon-192.png` },
  // Preview card when a link (calculation, team, search) is pasted in Discord, Slack, Twitter…
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [{ url: `${BASE_PATH}/og.png`, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [`${BASE_PATH}/og.png`] },
};

export const viewport: Viewport = { themeColor: "#0b1618" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
