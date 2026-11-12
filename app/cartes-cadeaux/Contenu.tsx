"use client";

import { useState } from "react";
import { supabase } from "../supabase";
import PageInfo, { Section } from "../PageInfo";
import { BOUTIQUE } from "../boutique";

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

export default function Contenu() {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  // Composition de la carte
  const [preset, setPreset] = useState<number | null>(
    BOUTIQUE.montantsCartes[1] ?? BOUTIQUE.montantsCartes[0] ?? null
  );
  const [libre, setLibre] = useState("");
  const [pour, setPour] = useState("");
  const [de, setDe] = useState("");
  const [mot, setMot] = useState("");

  // Vérification du solde
  const [code, setCode] = useState("");
  const [solde, setSolde] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");
  const [verif, setVerif] = useState(false);

  const montantLibre = Number(libre.replace(/\D/g, "")) || 0;
  const montant = montantLibre > 0 ? montantLibre : preset ?? 0;

  const message =
    `Bonjour ${BOUTIQUE.nom}, je souhaite offrir une carte cadeau` +
    (montant ? ` de ${fcfa(montant)}.` : ".") +
    (pour.trim() ? `\nPour : ${pour.trim()}` : "") +
    (de.trim() ? `\nDe la part de : ${de.trim()}` : "") +
    (mot.trim() ? `\nPetit mot : ${mot.trim()}` : "") +
    `\nPouvez-vous m'indiquer comment régler ?`;

  async function verifier(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setSolde(null);
    const c = code.trim().toUpperCase();
    if (!c) {
      setErreur("Entre ton code.");
      return;
    }
    setVerif(true);
    const { data, error } = await supabase.rpc("verifier_carte", { p_code: c });
    setVerif(false);
    if (error) {
      setErreur("Vérification impossible pour le moment.");
      return;
    }
    const s = Number(data) || 0;
    if (s <= 0) {
      setErreur("Code invalide ou carte déjà utilisée.");
      return;
    }
    setSolde(s);
  }

  const champ =
    "border border-or/40 rounded-lg w-full p-2.5 bg-white text-noir focus:outline-none focus:ring-2 focus:ring-or";

  return (
    <PageInfo titre="Cartes cadeaux">
      <p className="text-brun">
        Offre le choix, pas la taille : la personne choisit elle-même sa paire,
        sa pointure et son coloris sur toute la boutique.
      </p>

      {/* Aperçu de la carte */}
      <div className="rounded-2xl bg-gradient-to-br from-noir via-slate-700 to-noir text-white p-6 shadow-lg aspect-[16/9] max-w-md flex flex-col justify-between border border-or/40">
        <div className="flex justify-between items-start">
          <span className="font-bold tracking-widest text-or">
            {BOUTIQUE.nom.toUpperCase()}
          </span>
          <span className="text-xs text-white/60 uppercase tracking-widest">
            Gift card
          </span>
        </div>
        <div>
          <p className="text-3xl font-bold text-or">
            {montant ? fcfa(montant) : "—"}
          </p>
          <p className="text-sm text-white/80 mt-2">Pour : {pour.trim() || "—"}</p>
          <p className="text-sm text-white/80">De : {de.trim() || "—"}</p>
        </div>
        <p className="text-xs text-white/50 tracking-widest">ISMA-••••-••••-••••</p>
      </div>

      <Section titre="01 — Choisis la valeur">
        <div className="flex flex-wrap gap-2">
          {BOUTIQUE.montantsCartes.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={preset === m && !montantLibre}
              onClick={() => {
                setPreset(m);
                setLibre("");
              }}
              className={`rounded-full px-4 py-2 text-sm border ${
                preset === m && !montantLibre
                  ? "bg-noir text-or border-noir"
                  : "bg-white border-or/40 text-noir"
              }`}
            >
              {fcfa(m)}
            </button>
          ))}
        </div>
        <label className="block mt-2 text-sm">
          Montant libre (FCFA)
          <input
            inputMode="numeric"
            value={libre}
            onChange={(e) => setLibre(e.target.value.replace(/[^\d\s]/g, ""))}
            placeholder="Ex : 35000"
            className={`${champ} mt-1`}
          />
        </label>
      </Section>

      <Section titre="02 — Signe ton cadeau">
        <input
          value={pour}
          onChange={(e) => setPour(e.target.value)}
          placeholder="Pour"
          maxLength={40}
          className={champ}
        />
        <input
          value={de}
          onChange={(e) => setDe(e.target.value)}
          placeholder="De la part de"
          maxLength={40}
          className={champ}
        />
        <div>
          <textarea
            value={mot}
            onChange={(e) => setMot(e.target.value)}
            placeholder="Petit mot (optionnel)"
            maxLength={140}
            rows={3}
            className={champ}
          />
          <p className="text-xs text-right">{mot.length}/140</p>
        </div>
      </Section>

      <div className="bg-white border border-or/30 rounded-2xl p-4 flex items-center justify-between">
        <span className="text-sm text-brun">Total à régler</span>
        <span className="text-xl font-bold text-or-fonce">
          {montant ? fcfa(montant) : "—"}
        </span>
      </div>

      {numero ? (
        <a
          href={`https://wa.me/${numero}?text=${encodeURIComponent(message)}`}
          className="block text-center bg-green-600 text-white rounded-full px-6 py-3 font-semibold"
        >
          Commander sur WhatsApp
        </a>
      ) : (
        <p>Le contact WhatsApp sera bientôt disponible.</p>
      )}
      <p className="text-sm text-center">
        Aucun paiement par carte bancaire. Le règlement est organisé sur WhatsApp.
      </p>

      <Section titre="Comment ça marche">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Tu composes : montant, prénom et petit mot.</li>
          <li>
            Tu paies ({BOUTIQUE.paiements.join(", ")}) et tu reçois un code
            unique.
          </li>
          <li>
            La personne saisit ce code dans le champ « Carte cadeau » de son
            panier. Le solde non utilisé reste disponible.
          </li>
        </ol>
      </Section>

      <Section titre="Vérifier le solde d'une carte">
        <form onSubmit={verifier} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ISMA-XXXX-XXXX-XXXX"
            className={`${champ} flex-1 min-w-0 uppercase`}
          />
          <button
            type="submit"
            disabled={verif}
            className="bg-noir text-or rounded-lg px-4 font-semibold disabled:opacity-50"
          >
            {verif ? "..." : "Vérifier"}
          </button>
        </form>
        {erreur && <p className="text-red-700">{erreur}</p>}
        {solde !== null && (
          <p className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 font-semibold">
            Solde disponible : {fcfa(solde)}
          </p>
        )}
      </Section>
    </PageInfo>
  );
}