import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Collection from "../../Collection";
import { supabase } from "../../supabase";
import { BOUTIQUE, slugifier } from "../../boutique";

export const instant = false;

type Props = { params: Promise<{ slug: string }> };

async function trouverNom(slug: string) {
  const { data } = await supabase.from("marques").select("nom");
  return (data || []).find((m) => slugifier(m.nom) === slug)?.nom as string | undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const nom = await trouverNom(slug);
  if (!nom) return { title: "Marque introuvable" };
  return {
    title: `${nom} – ${BOUTIQUE.nom}`,
    description: `Toute la collection ${nom} chez ${BOUTIQUE.nom}. Commande sur WhatsApp.`,
    alternates: { canonical: `/marque/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const nom = await trouverNom((await params).slug);
  if (!nom) notFound();
  return <Collection type="marque" valeur={nom} />;
}