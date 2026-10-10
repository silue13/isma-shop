"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

type Carte = {
  id: number;
  code: string;
  montant: number;
  solde: number;
  note: string | null;
  actif: boolean;
  created_at: string;
};

// 32 caractères sans les ambiguïtés (pas de 0, O, 1, I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genererCode() {
  const octets = new Uint8Array(12);
  crypto.getRandomValues(octets);
  const l = Array.from(octets, (o) => ALPHABET[o % 32]);
  return `ISMA-${l.slice(0, 4).join("")}-${l.slice(4, 8).join("")}-${l
    .slice(8, 12)
    .join("")}`;
}

function fcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

function messageCarte(c: Carte) {
  return (
    `🎁 Carte cadeau Isma'Store de ${fcfa(c.montant)}\n` +
    `Code : ${c.code}\n` +
    `À saisir dans ton panier sur la boutique : ${window.location.origin}`
  );
}

export default function GestionCartes() {
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [montant, setMontant] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [nouvelle, setNouvelle] = useState<Carte | null>(null);

  async function charger() {
    const { data } = await supabase
      .from("cartes_cadeaux")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setCartes((data as Carte[]) || []);
  }

  useEffect(() => {
    charger();
  }, []);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setNouvelle(null);
    const m = parseInt(montant, 10);
    if (isNaN(m) || m <= 0) {
      setMessage("Entre un montant valide (en FCFA).");
      return;
    }
    setEnCours(true);

    let creee: Carte | null = null;
    for (let essai = 0; essai < 3 && !creee; essai++) {
      const { data, error } = await supabase
        .from("cartes_cadeaux")
        .insert({
          code: genererCode(),
          montant: m,
          solde: m,
          note: note.trim() || null,
        })
        .select("*")
        .single();
      if (!error && data) {
        creee = data as Carte;
      } else if (error?.code !== "23505") {
        setMessage("Erreur : " + (error?.message || "création impossible"));
        setEnCours(false);
        return;
      }
    }

    setEnCours(false);
    if (!creee) {
      setMessage("Erreur : impossible de générer un code, réessaie.");
      return;
    }
    setNouvelle(creee);
    setMontant("");
    setNote("");
    charger();
  }

  async function copier(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`Code ${code} copié ✅`);
    } catch {
      setMessage("Copie impossible, sélectionne le code à la main.");
    }
  }

  async function basculer(c: Carte) {
    const { error } = await supabase
      .from("cartes_cadeaux")
      .update({ actif: !c.actif })
      .eq("id", c.id);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  async function ajusterSolde(c: Carte) {
    const saisie = window.prompt(
      `Nouveau solde de la carte ${c.code} (FCFA) :`,
      String(c.solde)
    );
    if (saisie === null) return;
    const n = parseInt(saisie, 10);
    if (isNaN(n) || n < 0) {
      setMessage("Erreur : le solde doit être un nombre (0 ou plus).");
      return;
    }
    const { error } = await supabase
      .from("cartes_cadeaux")
      .update({ solde: n })
      .eq("id", c.id);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  async function supprimer(c: Carte) {
    if (!window.confirm(`Supprimer la carte ${c.code} ?`)) return;
    const { error } = await supabase
      .from("cartes_cadeaux")
      .delete()
      .eq("id", c.id);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  const champ =
    "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";

  return (
    <section className="bg-white shadow rounded-2xl p-5 mb-6 border border-or/20">
      <h2 className="text-lg font-bold mb-1">Cartes cadeaux</h2>
      <p className="text-sm text-brun mb-4">
        Crée un code avec un montant. Le client le saisit dans son panier et le
        solde est débité automatiquement.
      </p>

      <form onSubmit={creer} className="space-y-3 mb-4">
        <input
          type="number"
          inputMode="numeric"
          placeholder="Montant (FCFA), ex : 10000"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className={champ}
        />
        <input
          placeholder="Pour qui ? (facultatif, ex : Awa)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={champ}
        />
        <button
          type="submit"
          disabled={enCours}
          className="bg-noir text-or font-semibold rounded-lg w-full py-2.5 disabled:opacity-50"
        >
          {enCours ? "Création..." : "Créer la carte cadeau"}
        </button>
      </form>

      {message && (
        <p
          className={
            "text-sm mb-3 font-medium " +
            (message.startsWith("Erreur") ? "text-red-700" : "text-green-700")
          }
        >
          {message}
        </p>
      )}

      {nouvelle && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-green-800 mb-1">
            Carte de {fcfa(nouvelle.montant)} créée :
          </p>
          <p className="font-mono text-xl font-bold tracking-wider break-all">
            {nouvelle.code}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => copier(nouvelle.code)}
              className="bg-white border border-or/50 rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              Copier le code
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                messageCarte(nouvelle)
              )}`}
              target="_blank"
              className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              Envoyer sur WhatsApp
            </a>
          </div>
        </div>
      )}

      {cartes.length === 0 && (
        <p className="text-brun text-sm">Aucune carte pour le moment.</p>
      )}

      {cartes.map((c) => {
        const etat = !c.actif
          ? { texte: "Désactivée", classe: "bg-gray-100 text-gray-700" }
          : c.solde <= 0
          ? { texte: "Utilisée", classe: "bg-red-100 text-red-700" }
          : { texte: "Active", classe: "bg-green-100 text-green-800" };
        return (
          <div key={c.id} className="border border-or/20 rounded-xl p-3 mb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono font-bold break-all">{c.code}</p>
                <p className="text-sm">
                  Solde : <b className="text-or-fonce">{fcfa(c.solde)}</b>{" "}
                  <span className="text-brun">/ {fcfa(c.montant)}</span>
                </p>
                {c.note && <p className="text-xs text-brun">🎁 {c.note}</p>}
              </div>
              <span
                className={
                  "text-xs font-semibold rounded-full px-3 py-1 " + etat.classe
                }
              >
                {etat.texte}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => copier(c.code)}
                className="bg-creme rounded-lg px-3 py-1.5 text-sm"
              >
                Copier
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  messageCarte(c)
                )}`}
                target="_blank"
                className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-sm"
              >
                WhatsApp
              </a>
              <button
                onClick={() => ajusterSolde(c)}
                className="bg-creme rounded-lg px-3 py-1.5 text-sm"
              >
                Ajuster le solde
              </button>
              <button
                onClick={() => basculer(c)}
                className="bg-creme rounded-lg px-3 py-1.5 text-sm"
              >
                {c.actif ? "Désactiver" : "Réactiver"}
              </button>
              <button
                onClick={() => supprimer(c)}
                className="text-sm text-red-700 underline px-1"
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