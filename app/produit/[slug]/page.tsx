import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "../../supabase";
import { BOUTIQUE, idDepuisSlug, lienProduit } from "../../boutique";
import PageProduit from "../PageProduit";

export const instant = false;

type Props = { params: Promise<{ slug: string }> };

async function charger(slug: string) {
  const id = idDepuisSlug(slug);
  if (!id) return null;
  const { data } = await supabase
    .from("products")
    .select("id, nom, description, prix, photos")
    .eq("id", id)
    .eq("actif", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await charger((await params).slug);
  if (!p) return { title: "Produit introuvable" };
  const titre = `${p.nom} – ${BOUTIQUE.nom}`;
  const desc = (
    p.description ||
    `${p.nom} à ${p.prix.toLocaleString("fr-FR")} FCFA. Commande sur WhatsApp.`
  ).slice(0, 160);
  const images = p.photos?.[0] ? [p.photos[0]] : undefined;
  return {
    title: titre,
    description: desc,
    alternates: { canonical: lienProduit(p) },
    openGraph: { title: titre, description: desc, images },
    twitter: { card: "summary_large_image", title: titre, description: desc, images },
  };
}

export default async function Page({ params }: Props) {
  const p = await charger((await params).slug);
  if (!p) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nom,
    description: p.description || p.nom,
    image: p.photos,
    brand: { "@type": "Brand", name: BOUTIQUE.nom },
    offers: { "@type": "Offer", price: p.prix, priceCurrency: "XOF" },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageProduit id={p.id} />
    </>
  );
}