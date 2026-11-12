import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Collection from "../../Collection";
import { BOUTIQUE, LISTE_CATEGORIES } from "../../boutique";

export const instant = false;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = LISTE_CATEGORIES.find((x) => x.id === id);
  if (!c) return { title: "Catégorie introuvable" };
  return {
    title: `${c.nom} – ${BOUTIQUE.nom}`,
    description: `Découvre notre sélection ${c.nom} chez ${BOUTIQUE.nom}. Commande sur WhatsApp.`,
    alternates: { canonical: `/categorie/${c.id}` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!LISTE_CATEGORIES.some((x) => x.id === id)) notFound();
  return <Collection type="categorie" valeur={id} />;
}