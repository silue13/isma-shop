"use client";

import { useState } from "react";
import { supabase } from "../supabase";

// L'offre doit valoir au moins ce pourcentage du prix affiché (à modifier si tu veux)
const OFFRE_MIN_POURCENT = 50;

function fcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export default function FaireOffre({
  produitId,
  nom,
  prix,
}: {
  produitId: number;
  nom: string;
  prix: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [prixOffert, setPrixOffert] = useState("");
  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [envoyee, setEnvoyee] = useState(false);
  const [offreEnvoyee, setOffreEnvoyee] = useState(0);

  const minimum = Math.ceil((prix * OFFRE_MIN_POURCENT) / 100);
  const numeroVendeur = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  function fermer() {
    setOuvert(false);
    setErreur("");
    if (envoyee) {
      setEnvoyee(false);
      setPrixOffert("");
    }
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    const offre = parseInt(prixOffert, 10);
    const tel = telephone.replace(/\s+/g, "");

    if (isNaN(offre) || offre < minimum || offre >= prix) {
      setErreur(
        `Ton offre doit être comprise entre ${fcfa(minimum)} et ${fcfa(
          prix - 1
        )}.`
      );
      return;
    }
    if (!nomClient.trim()) {
      setErreur("Indique ton nom.");
      return;
    }
    if (!/^\d{8,14}$/.test(tel)) {
      setErreur("Indique un numéro de téléphone valide (chiffres seulement).");
      return;
    }

    setEnCours(true);
    const { error } = await supabase.from("offres").insert({
      product_id: produitId,
      produit_nom: nom,
      prix_produit: prix,
      prix_offert: offre,
      nom: nomClient.trim(),
      telephone: tel,
    });
    setEnCours(false);

    if (error) {
      setErreur("Envoi impossible pour le moment. Réessaie dans un instant.");
      return;
    }
    setOffreEnvoyee(offre);
    setEnvoyee(true);
  }

  const messageWhatsapp =
    `Bonjour, je fais une offre de ${fcfa(offreEnvoyee)} pour "${nom}" ` +
    `(prix affiché : ${fcfa(prix)}). Je m'appelle ${nomClient.trim()}.`;

  const champ =
    "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        className="w-full mt-3 py-3.5 rounded-lg border-2 border-noir bg-white text-noir font-semibold text-lg"
      >
        Faire une offre
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
          onClick={fermer}
        >
          <div
            className="bg-creme w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold">Faire une offre</h2>
                <p className="text-sm text-brun mt-1">
                  {nom} · prix affiché {fcfa(prix)}
                </p>
              </div>
              <button
                onClick={fermer}
                className="text-3xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {envoyee ? (
              <div>
                <p className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 font-semibold">
                  ✓ Offre de {fcfa(offreEnvoyee)} envoyée !
                </p>
                <p className="text-sm text-brun mt-3">
                  Le vendeur te répondra sur WhatsApp au numéro que tu as
                  indiqué.
                </p>
                {numeroVendeur && (
                  <a
                    href={`https://wa.me/${numeroVendeur}?text=${encodeURIComponent(
                      messageWhatsapp
                    )}`}
                    className="block text-center bg-green-600 text-white font-semibold rounded-lg py-3 mt-4"
                  >
                    Prévenir aussi sur WhatsApp
                  </a>
                )}
                <button
                  onClick={fermer}
                  className="block w-full text-center bg-white border border-or/50 rounded-lg py-3 mt-3"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={envoyer}>
                <label className="block text-sm font-medium text-brun mb-1">
                  Ton prix (FCFA)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={String(minimum)}
                  value={prixOffert}
                  onChange={(e) => setPrixOffert(e.target.value)}
                  className={champ + " mb-3"}
                />

                <label className="block text-sm font-medium text-brun mb-1">
                  Ton nom
                </label>
                <input
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                  className={champ + " mb-3"}
                />

                <label className="block text-sm font-medium text-brun mb-1">
                  Ton numéro WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="0574963117"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className={champ}
                />

                {erreur && (
                  <p className="bg-red-50 text-red-700 rounded-lg p-2 mt-3 text-sm">
                    {erreur}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enCours}
                  className="bg-noir text-or font-semibold rounded-lg w-full mt-4 py-3 disabled:opacity-50"
                >
                  {enCours ? "Envoi..." : "Envoyer mon offre"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}