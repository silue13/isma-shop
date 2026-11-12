import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BOUTIQUE } from "./boutique";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

const titre = `${BOUTIQUE.nom} – Sneakers tendance premium`;
const description = `Sneakers tendance premium à des prix imbattables. Commande sur WhatsApp${
  BOUTIQUE.paiementEn3Fois ? ` et paie en ${BOUTIQUE.nbVersements} fois` : ""
}.`;
const image = {
  url: "/logo-banniere.jpg",
  width: 1600,
  height: 791,
  alt: BOUTIQUE.nom,
};

export const metadata = {
  // Adresse de ton site, définie dans les variables d'environnement (ex. https://isma-store.com)
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: titre,
  description,
  openGraph: {
    title: titre,
    description,
    siteName: BOUTIQUE.nom,
    type: "website",
    locale: "fr_CI",
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title: titre,
    description,
    images: [image.url],
  },
};

export const viewport = { themeColor: "#000000" };
