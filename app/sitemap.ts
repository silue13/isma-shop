import type { MetadataRoute } from "next";
import { supabase } from "./supabase";
import { lienProduit, slugifier, LISTE_CATEGORIES } from "./boutique";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: produits } = await supabase.from("products").select("id, nom").eq("actif", true);
  const { data: marques } = await supabase.from("marques").select("nom");
  return [
    { url: site },
    ...LISTE_CATEGORIES.map((c) => ({ url: `${site}/categorie/${c.id}` })),
    ...(marques || []).map((m) => ({ url: `${site}/marque/${slugifier(m.nom)}` })),
    ...(produits || []).map((p) => ({ url: site + lienProduit(p) })),
  ];
}
