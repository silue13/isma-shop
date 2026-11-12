"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../supabase";
import PageInfo from "../PageInfo";
import { BOUTIQUE, prixEn3Fois } from "../boutique";

type LignePanier = {
  cle: string;
  nom: string;
  prix: number;
  pointure: string;
  couleur: string;
  qte: number;
};
type Profil = { nom: string; telephone: string; lieu: string | null };

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
const champ =
  "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";

export default function PagePanier() {
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [charge, setCharge] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [nomLivraison, setNomLivraison] = useState("");
  const [lieuLivraison, setLieuLivraison] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [paiement3x, setPaiement3x] = useState(false);
  const [codeCarte, setCodeCarte] = useState("");
  const [carte, setCarte] = useState<{ code: string; solde: number } | null>(null);
  const [erreurCarte, setErreurCarte] = useState("");
  const [verifCarte, setVerifCarte] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("panier");
      if (s) setPanier(JSON.parse(s));
    } catch {}
    setCharge(true);
  }, []);

  useEffect(() => {
    if (charge) localStorage.setItem("panier", JSON.stringify(panier));
  }, [panier, charge]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: ab } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user.id ?? null));
    return () => ab.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfil(null);
      return;
    }
    supabase
      .from("clients")
      .select("nom, telephone, lieu")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Profil | null;
        setProfil(p);
        if (p) {
          setNomLivraison(p.nom);
          setLieuLivraison(p.lieu || "");
        }
      });
  }, [userId]);

  const total = panier.reduce((s, l) => s + l.prix * l.qte, 0);
  const reduction = carte ? Math.min(carte.solde, total) : 0;
  const totalAPayer = total - reduction;

  function changerQte(cle: string, delta: number) {
    setPanier((prev) =>
      prev.map((l) => (l.cle === cle ? { ...l, qte: l.qte + delta } : l)).filter((l) => l.qte > 0)
    );
  }

  async function appliquerCarte() {
    setErreurCarte("");
    const code = codeCarte.trim().toUpperCase();
    if (!code) {
      setErreurCarte("Entre ton code.");
      return;
    }
    setVerifCarte(true);
    const { data, error } = await supabase.rpc("verifier_carte", { p_code: code });
    setVerifCarte(false);
    if (error) {
      setErreurCarte("Vérification impossible pour le moment.");
      return;
    }
    const solde = Number(data) || 0;
    if (solde <= 0) {
      setCarte(null);
      setErreurCarte("Code invalide ou carte déjà utilisée.");
      return;
    }
    setCarte({ code, solde });
    setCodeCarte("");
  }

  async function commander() {
    setErreur("");
    if (!userId || !profil) return;
    if (!nomLivraison.trim() || !lieuLivraison.trim()) {
      setErreur("Indique ton nom et ton lieu de livraison.");
      return;
    }
    const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!numero) {
      setErreur("Le numéro WhatsApp du vendeur n'est pas configuré.");
      return;
    }
    setEnCours(true);

    const articles = panier.map((l) => ({
      produit_id: Number(l.cle.split("-")[0]),
      nom: l.nom,
      prix: l.prix,
      pointure: l.pointure,
      couleur: l.couleur,
      qte: l.qte,
    }));

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        nom: nomLivraison.trim(),
        telephone: profil.telephone,
        lieu: lieuLivraison.trim(),
        articles,
        total: totalAPayer,
        carte_code: carte && reduction > 0 ? carte.code : null,
        reduction,
      })
      .select("id")
      .single();

    if (error || !data) {
      const carteRefusee = !!error?.message?.includes("Carte cadeau");
      if (carteRefusee) setCarte(null);
      setErreur(
        carteRefusee
          ? "Cette carte cadeau n'est plus valable ou son solde est insuffisant. Elle a été retirée, vérifie le total."
          : "Impossible d'enregistrer la commande : " + (error?.message || "")
      );
      setEnCours(false);
      return;
    }

    const lignes = panier.map((l, i) =>
      [
        `*${i + 1}. ${l.nom}*`,
        l.pointure ? `   Pointure : ${l.pointure}` : "",
        l.couleur ? `   Couleur : ${l.couleur}` : "",
        `   Quantité : ${l.qte} x ${l.prix} FCFA = *${l.prix * l.qte} FCFA*`,
      ]
        .filter(Boolean)
        .join("\n")
    );

    const message =
      `🛍️ *COMMANDE N°${data.id} - ${BOUTIQUE.nom.toUpperCase()}*\n\n` +
      `👤 *Client* : ${nomLivraison.trim()}\n` +
      `📞 *Téléphone* : ${profil.telephone}\n` +
      `📍 *Livraison* : ${lieuLivraison.trim()}\n\n` +
      `${lignes.join("\n\n")}\n\n` +
      `━━━━━━━━━━━━\n` +
      (reduction > 0 && carte
        ? `Sous-total : ${total} FCFA\n🎁 *Carte cadeau* (${carte.code}) : -${reduction} FCFA\n`
        : "") +
      `💰 *TOTAL À PAYER : ${totalAPayer} FCFA*\n` +
      (paiement3x && BOUTIQUE.paiementEn3Fois
        ? `💳 *Paiement en ${BOUTIQUE.nbVersements} fois demandé* : ${BOUTIQUE.nbVersements} x ${prixEn3Fois(totalAPayer)} FCFA environ\n`
        : "") +
      `━━━━━━━━━━━━\n\n` +
      `Merci de me confirmer la disponibilité, le prix de la livraison et le mode de paiement. 🙏`;

    localStorage.removeItem("panier");
    setPanier([]);
    window.location.href = `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
  }

  return (
    <PageInfo titre="Mon panier">
      {charge && panier.length === 0 && (
        <div>
          <p className="text-brun">Ton panier est vide.</p>
          <Link href="/" className="inline-block mt-4 bg-noir text-or rounded-full px-6 py-2.5 font-semibold">
            Continuer mes achats
          </Link>
        </div>
      )}

      {panier.map((l) => (
        <div key={l.cle} className="bg-white rounded-xl p-3 border border-or/30">
          <p className="font-semibold">{l.nom}</p>
          <p className="text-sm text-brun">
            {l.pointure && `Pointure ${l.pointure}`}
            {l.pointure && l.couleur && " · "}
            {l.couleur}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button onClick={() => changerQte(l.cle, -1)} className="bg-noir text-or rounded px-3">−</button>
              <span className="font-semibold">{l.qte}</span>
              <button onClick={() => changerQte(l.cle, 1)} className="bg-noir text-or rounded px-3">+</button>
            </div>
            <p className="font-bold text-or-fonce">{fcfa(l.prix * l.qte)}</p>
          </div>
        </div>
      ))}

      {panier.length > 0 && (
        <>
          <p className="text-xl font-bold">Total : {fcfa(total)}</p>
          <div className="bg-white rounded-xl border border-or/30 p-3">
            {carte ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">🎁 Carte <b>{carte.code}</b> appliquée : <b className="text-or-fonce">-{fcfa(reduction)}</b></p>
                <button onClick={() => setCarte(null)} className="text-sm underline text-brun shrink-0">Retirer</button>
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-brun mb-1">Carte cadeau</label>
                <div className="flex gap-2">
                  <input value={codeCarte} onChange={(e) => setCodeCarte(e.target.value)} placeholder="ISMA-XXXX-XXXX-XXXX" className="border border-or/40 rounded-lg flex-1 min-w-0 p-2.5 bg-white uppercase focus:outline-none focus:ring-2 focus:ring-or" />
                  <button onClick={appliquerCarte} disabled={verifCarte} className="bg-noir text-or rounded-lg px-4 font-semibold disabled:opacity-50">{verifCarte ? "..." : "Appliquer"}</button>
                </div>
              </>
            )}
            {erreurCarte && <p className="text-sm text-red-700 mt-2">{erreurCarte}</p>}
          </div>

          {reduction > 0 && <p className="text-xl font-bold">À payer : {fcfa(totalAPayer)}</p>}

          {BOUTIQUE.paiementEn3Fois && totalAPayer > 0 && (
            <label className="flex items-start gap-3 bg-white rounded-xl border border-or/30 p-3 cursor-pointer">
              <input type="checkbox" checked={paiement3x} onChange={(e) => setPaiement3x(e.target.checked)} className="mt-1 h-5 w-5 accent-or-fonce" />
              <span className="text-sm">
                <b>Je veux payer en {BOUTIQUE.nbVersements} fois</b>
                <span className="block text-brun">
                  {BOUTIQUE.nbVersements} x {fcfa(prixEn3Fois(totalAPayer))} environ. Les conditions sont confirmées sur WhatsApp.{" "}
                  <Link href="/paiement-echelonne" className="underline">Détails</Link>
                </span>
              </span>
            </label>
          )}

          {!userId && (
            <div className="bg-white rounded-xl border border-or/30 p-4">
              <p className="text-sm text-brun mb-3">Pour commander, crée ton compte ou connecte-toi. Ton panier sera gardé.</p>
              <Link href="/compte?retour=panier" className="block text-center bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg py-3">
                Se connecter / S&apos;inscrire
              </Link>
            </div>
          )}

          {userId && !profil && (
            <p className="text-sm text-brun">Ce compte n&apos;a pas de profil client. Déconnecte-toi puis inscris-toi avec ton numéro sur la page « Connexion ».</p>
          )}

          {userId && profil && (
            <div>
              <label className="block text-sm font-medium text-brun mb-1">Nom pour la livraison</label>
              <input value={nomLivraison} onChange={(e) => setNomLivraison(e.target.value)} className={champ + " mb-3"} />
              <label className="block text-sm font-medium text-brun mb-1">Lieu de livraison (quartier, ville)</label>
              <input value={lieuLivraison} onChange={(e) => setLieuLivraison(e.target.value)} className={champ} />
              {erreur && <p className="bg-red-50 text-red-700 rounded-lg p-2 mt-3 text-sm">{erreur}</p>}
              <button onClick={commander} disabled={enCours} className="bg-green-600 hover:bg-green-700 text-white rounded-lg w-full mt-4 py-3 font-semibold disabled:opacity-50">
                {enCours ? "Patiente..." : "Commander sur WhatsApp"}
              </button>
              <p className="text-xs text-brun text-center mt-2">WhatsApp s&apos;ouvre avec ta commande : appuie sur Envoyer.</p>
            </div>
          )}
        </>
      )}
    </PageInfo>
  );
}
