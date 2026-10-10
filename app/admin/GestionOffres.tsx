"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

type Offre = {
  id: number;
  produit_nom: string;
  prix_produit: number;
  prix_offert: number;
  nom: string;
  telephone: string;
  statut: string;
  created_at: string;
};

const STATUTS: Record<string, { texte: string; classe: string }> = {
  en_attente: { texte: "En attente", classe: "bg-yellow-100 text-yellow-800" },
  acceptee: { texte: "Acceptée", classe: "bg-green-100 text-green-800" },
  refusee: { texte: "Refusée", classe: "bg-red-100 text-red-700" },
};

function fcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

function lienWhatsapp(o: Offre) {
  const num =
    o.telephone.startsWith("225") && o.telephone.length > 10
      ? o.telephone
      : "225" + o.telephone;
  let texte = `Bonjour ${o.nom}, au sujet de ton offre de ${fcfa(
    o.prix_offert
  )} pour "${o.produit_nom}" (prix affiché : ${fcfa(o.prix_produit)}).`;
  if (o.statut === "acceptee") {
    texte = `Bonjour ${o.nom}, bonne nouvelle : ton offre de ${fcfa(
      o.prix_offert
    )} pour "${o.produit_nom}" est acceptée ✅. Peux-tu me confirmer ta pointure et ton lieu de livraison ?`;
  } else if (o.statut === "refusee") {
    texte = `Bonjour ${o.nom}, merci pour ton offre de ${fcfa(
      o.prix_offert
    )} pour "${o.produit_nom}". Nous ne pouvons malheureusement pas descendre à ce prix.`;
  }
  return `https://wa.me/${num}?text=${encodeURIComponent(texte)}`;
}

export default function GestionOffres() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [message, setMessage] = useState("");

  async function charger() {
    const { data } = await supabase
      .from("offres")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setOffres((data as Offre[]) || []);
  }

  useEffect(() => {
    charger();
  }, []);

  async function changerStatut(id: number, statut: string) {
    setMessage("");
    const { error } = await supabase
      .from("offres")
      .update({ statut })
      .eq("id", id);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  async function supprimer(id: number) {
    if (!window.confirm("Supprimer cette offre ?")) return;
    const { error } = await supabase.from("offres").delete().eq("id", id);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  const nbEnAttente = offres.filter((o) => o.statut === "en_attente").length;

  return (
    <section className="bg-white shadow rounded-2xl p-5 mb-6 border border-or/20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">
          Offres des clients
          {nbEnAttente > 0 &&
            ` (${nbEnAttente} nouvelle${nbEnAttente > 1 ? "s" : ""})`}
        </h2>
        <button
          onClick={charger}
          className="text-sm bg-creme rounded-lg px-3 py-1.5"
        >
          Actualiser
        </button>
      </div>

      {message && <p className="text-sm text-red-700 mb-2">{message}</p>}

      {offres.length === 0 && (
        <p className="text-brun text-sm">Aucune offre pour le moment.</p>
      )}

      {offres.map((o) => {
        const st = STATUTS[o.statut] || {
          texte: o.statut,
          classe: "bg-gray-100 text-gray-700",
        };
        return (
          <div
            key={o.id}
            className="border border-or/20 rounded-xl p-3 mb-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{o.produit_nom}</p>
                <p className="text-sm">
                  Offre :{" "}
                  <b className="text-or-fonce">{fcfa(o.prix_offert)}</b>{" "}
                  <span className="text-brun">
                    (prix affiché {fcfa(o.prix_produit)})
                  </span>
                </p>
                <p className="text-sm mt-1">
                  👤 {o.nom} · 📞 {o.telephone}
                </p>
                <p className="text-xs text-brun mt-1">
                  {new Date(o.created_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <span
                className={
                  "text-xs font-semibold rounded-full px-3 py-1 " + st.classe
                }
              >
                {st.texte}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {o.statut !== "acceptee" && (
                <button
                  onClick={() => changerStatut(o.id, "acceptee")}
                  className="bg-green-50 hover:bg-green-100 text-green-800 rounded-lg px-3 py-1.5 text-sm font-medium"
                >
                  Accepter
                </button>
              )}
              {o.statut !== "refusee" && (
                <button
                  onClick={() => changerStatut(o.id, "refusee")}
                  className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-1.5 text-sm font-medium"
                >
                  Refuser
                </button>
              )}
              <a
                href={lienWhatsapp(o)}
                target="_blank"
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium"
              >
                Répondre sur WhatsApp
              </a>
              <button
                onClick={() => supprimer(o.id)}
                className="text-sm text-brun underline px-1"
              >
                Supprimer
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}