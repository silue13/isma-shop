"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

type ProduitLite = { id: number; nom: string };

type Code = {
  code: string;
  product_id: number;
  used: boolean;
  created_at: string;
};

type Avis = {
  id: number;
  product_id: number;
  nom: string;
  note: number;
  commentaire: string | null;
  visible: boolean;
  created_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function genererCode(): string {
  const octets = new Uint8Array(8);
  crypto.getRandomValues(octets);
  return Array.from(octets, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export default function AdminAvis({ produits }: { produits: ProduitLite[] }) {
  const [produitId, setProduitId] = useState("");
  const [codes, setCodes] = useState<Code[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [message, setMessage] = useState("");
  const [copie, setCopie] = useState("");

  const nomProduit = (id: number) =>
    produits.find((p) => p.id === id)?.nom ?? `Produit #${id}`;

  const charger = useCallback(async () => {
    const [c, a] = await Promise.all([
      supabase
        .from("review_codes")
        .select("*")
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (c.error || a.error) {
      setMessage("Erreur : " + (c.error?.message || a.error?.message));
      return;
    }
    setCodes((c.data as Code[]) || []);
    setAvis((a.data as Avis[]) || []);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  async function creerCode() {
    setMessage("");
    if (!produitId) {
      setMessage("Erreur : choisis d'abord le produit livré.");
      return;
    }
    const { error } = await supabase
      .from("review_codes")
      .insert({ code: genererCode(), product_id: Number(produitId) });
    if (error) {
      setMessage("Erreur : " + error.message);
      return;
    }
    charger();
  }

  async function copierMessage(c: Code) {
    const texte =
      `Merci pour ta commande chez Isma'Store ! 🙏\n\n` +
      `Donne ton avis sur « ${nomProduit(c.product_id)} » :\n` +
      `1. Ouvre ${window.location.origin}\n` +
      `2. Clique sur les étoiles du produit\n` +
      `3. Saisis ce code : *${c.code}*`;
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(c.code);
      setTimeout(() => setCopie(""), 2000);
    } catch {
      setMessage("Erreur : copie impossible, recopie le code à la main.");
    }
  }

  async function supprimerCode(code: string) {
    const { error } = await supabase.from("review_codes").delete().eq("code", code);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  async function basculerAvis(a: Avis) {
    const { error } = await supabase
      .from("reviews")
      .update({ visible: !a.visible })
      .eq("id", a.id);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  async function supprimerAvis(a: Avis) {
    if (!confirm(`Supprimer l'avis de ${a.nom} ?`)) return;
    const { error } = await supabase.from("reviews").delete().eq("id", a.id);
    if (error) setMessage("Erreur : " + error.message);
    charger();
  }

  return (
    <>
      <section className="bg-white shadow rounded-2xl p-5 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Codes d&apos;avis clients
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Après une livraison, génère un code pour le produit livré et envoie-le au
          client. Chaque code ne sert qu&apos;une fois.
        </p>

        <div className="flex gap-2 mb-4">
          <select
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
            className="border border-slate-300 rounded-lg flex-1 p-2.5 bg-white"
          >
            <option value="">Produit livré...</option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
          <button
            onClick={creerCode}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4"
          >
            Générer
          </button>
        </div>

        {message && (
          <p className="bg-red-50 text-red-700 rounded-lg p-2 mb-3 text-sm">
            {message}
          </p>
        )}

        {codes.length === 0 && (
          <p className="text-sm text-slate-500">Aucun code en attente.</p>
        )}
        {codes.map((c) => (
          <div
            key={c.code}
            className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg p-2 mb-2"
          >
            <div>
              <p className="font-mono font-bold tracking-widest">{c.code}</p>
              <p className="text-xs text-slate-500">{nomProduit(c.product_id)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copierMessage(c)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-sm"
              >
                {copie === c.code ? "Copié ✓" : "Copier le message"}
              </button>
              <button
                onClick={() => supprimerCode(c.code)}
                className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-1.5 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-900 mb-3">
          Avis des clients ({avis.length})
        </h2>
        {avis.length === 0 && (
          <p className="text-slate-500">Aucun avis pour le moment.</p>
        )}
        {avis.map((a) => (
          <div key={a.id} className="bg-white shadow rounded-2xl p-3 mb-3">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {a.nom} · {"★".repeat(a.note)}
                  <span className="text-slate-400">{"★".repeat(5 - a.note)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {nomProduit(a.product_id)} ·{" "}
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <button
                  onClick={() => basculerAvis(a)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg px-3 py-1.5 text-sm"
                >
                  {a.visible ? "Masquer" : "Afficher"}
                </button>
                <button
                  onClick={() => supprimerAvis(a)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-1.5 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
            {a.commentaire && (
              <p className="text-sm mt-2 whitespace-pre-line">{a.commentaire}</p>
            )}
            {!a.visible && (
              <p className="text-xs text-red-600 mt-1">Masqué dans la boutique</p>
            )}
          </div>
        ))}
      </section>
    </>
  );
}