"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { emailDepuisNom, nettoyerNumero, slugNom } from "../auth";

type Profil = { nom: string; telephone: string; lieu: string | null };

type Article = {
  produit_id?: number;
  nom: string;
  prix: number;
  pointure: string;
  couleur: string;
  qte: number;
};

type Commande = {
  id: number;
  articles: Article[];
  total: number;
  statut: string;
  created_at: string;
};

type Avis = {
  id: number;
  product_id: number;
  order_id: number;
  etoiles: number;
  commentaire: string | null;
};

const STATUTS: Record<string, { texte: string; classe: string }> = {
  en_attente: { texte: "En attente", classe: "bg-yellow-100 text-yellow-800" },
  confirmee: { texte: "Confirmée", classe: "bg-blue-100 text-blue-800" },
  livree: { texte: "Livrée", classe: "bg-green-100 text-green-800" },
  annulee: { texte: "Annulée", classe: "bg-red-100 text-red-700" },
};

const champ =
  "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";
const etiquette = "block text-sm font-medium text-brun mb-1";

function Etoiles({
  valeur,
  onChange,
}: {
  valeur: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={
            "text-3xl leading-none " +
            (n <= valeur ? "text-or" : "text-gray-300")
          }
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function Compte() {
  const [verification, setVerification] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [profilCharge, setProfilCharge] = useState(false);

  const [mode, setMode] = useState<"inscription" | "connexion">("inscription");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [lieu, setLieu] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [brouillons, setBrouillons] = useState<
    Record<string, { etoiles: number; commentaire: string }>
  >({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setVerification(false);
    });
    const { data: abonnement } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user.id ?? null);
      }
    );
    return () => abonnement.subscription.unsubscribe();
  }, []);

  async function chargerCommandes(id: string) {
    const { data } = await supabase
      .from("orders")
      .select("id, articles, total, statut, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setCommandes((data as Commande[]) || []);
  }

  async function chargerAvis(id: string) {
    const { data } = await supabase
      .from("reviews")
      .select("id, product_id, order_id, etoiles, commentaire")
      .eq("user_id", id);
    setAvis((data as Avis[]) || []);
  }

  useEffect(() => {
    if (!userId) {
      setProfil(null);
      setProfilCharge(false);
      setCommandes([]);
      setAvis([]);
      return;
    }
    supabase
      .from("clients")
      .select("nom, telephone, lieu")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfil((data as Profil) || null);
        setProfilCharge(true);
      });
    chargerCommandes(userId);
    chargerAvis(userId);
  }, [userId]);

  async function sInscrire() {
    setErreur("");
    const tel = nettoyerNumero(telephone);

    if (!nom.trim()) return setErreur("Écris ton nom ou surnom.");
    if (!slugNom(nom))
      return setErreur(
        "Ton nom ou surnom doit contenir des lettres ou des chiffres."
      );
    if (tel.length !== 10)
      return setErreur("Le numéro doit avoir 10 chiffres après +225.");
    if (motDePasse.length < 6)
      return setErreur("Le mot de passe doit avoir au moins 6 caractères.");

    setEnCours(true);
    const { data, error } = await supabase.auth.signUp({
      email: emailDepuisNom(nom),
      password: motDePasse,
    });

    if (error) {
      const m = error.message.toLowerCase();
      setErreur(
        m.includes("already")
          ? "Ce nom ou surnom est déjà pris. Choisis-en un autre (ajoute un chiffre par exemple) ou va dans Connexion."
          : m.includes("signups not allowed")
          ? "Les inscriptions sont fermées dans Supabase (Allow new users to sign up)."
          : "Erreur : " + error.message
      );
      setEnCours(false);
      return;
    }

    if (!data.session || !data.user) {
      setErreur(
        "Compte créé mais non connecté. Dans Supabase, désactive « Confirm email »."
      );
      setEnCours(false);
      return;
    }

    const { error: erreurProfil } = await supabase.from("clients").insert({
      user_id: data.user.id,
      nom: nom.trim(),
      telephone: tel,
      lieu: lieu.trim(),
    });

    if (erreurProfil) {
      setErreur("Erreur profil : " + erreurProfil.message);
    } else {
      setProfil({ nom: nom.trim(), telephone: tel, lieu: lieu.trim() });
      setProfilCharge(true);
    }
    setEnCours(false);
  }

  async function seConnecter() {
    setErreur("");
    if (!slugNom(nom)) {
      setErreur("Écris ton nom ou surnom.");
      return;
    }
    setEnCours(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailDepuisNom(nom),
      password: motDePasse,
    });
    if (error) setErreur("Nom ou mot de passe incorrect.");
    setEnCours(false);
  }

  async function seDeconnecter() {
    await supabase.auth.signOut();
    setMotDePasse("");
  }

  // ----- Avis -----
  const avisParCle: Record<string, Avis> = {};
  avis.forEach((a) => {
    avisParCle[`${a.order_id}-${a.product_id}`] = a;
  });

  function lireBrouillon(cle: string) {
    return (
      brouillons[cle] ?? {
        etoiles: avisParCle[cle]?.etoiles ?? 0,
        commentaire: avisParCle[cle]?.commentaire ?? "",
      }
    );
  }

  function majBrouillon(
    cle: string,
    champModifie: "etoiles" | "commentaire",
    valeur: number | string
  ) {
    const actuel = lireBrouillon(cle);
    setBrouillons((prev) => ({
      ...prev,
      [cle]: { ...actuel, [champModifie]: valeur },
    }));
  }

  async function envoyerAvis(c: Commande, a: Article) {
    if (!userId || !profil || !a.produit_id) return;
    const cle = `${c.id}-${a.produit_id}`;
    const b = lireBrouillon(cle);

    if (b.etoiles < 1) {
      setMessages((m) => ({ ...m, [cle]: "Choisis un nombre d'étoiles." }));
      return;
    }

    const commentaire = b.commentaire.trim() || null;
    const existant = avisParCle[cle];

    const { error } = existant
      ? await supabase
          .from("reviews")
          .update({ etoiles: b.etoiles, commentaire })
          .eq("id", existant.id)
      : await supabase.from("reviews").insert({
          product_id: a.produit_id,
          user_id: userId,
          order_id: c.id,
          etoiles: b.etoiles,
          commentaire,
          auteur: profil.nom.split(" ")[0],
        });

    setMessages((m) => ({
      ...m,
      [cle]: error ? "Erreur : " + error.message : "Merci pour ton avis !",
    }));
    if (!error) chargerAvis(userId);
  }

  const entete = (
    <header className="bg-noir text-white shadow">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <p className="text-xl font-bold tracking-widest text-or">
          ISMA&apos;STORE
        </p>
        <a
          href="/"
          className="text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2"
        >
          Boutique
        </a>
      </div>
    </header>
  );

  if (verification) {
    return (
      <div className="min-h-screen bg-creme text-brun p-6">Chargement...</div>
    );
  }

  // ----- Client connecté -----
  if (userId) {
    return (
      <div className="min-h-screen bg-creme text-noir">
        {entete}
        <main className="max-w-lg mx-auto p-4 pb-10">
          <div className="bg-white rounded-2xl shadow border border-or/30 p-6 mt-6">
            {!profilCharge && <p className="text-brun">Chargement...</p>}
            {profilCharge && profil && (
              <>
                <h1 className="text-2xl font-bold mb-1">
                  Bonjour {profil.nom} 👋
                </h1>
                <p className="text-brun">Téléphone : +225 {profil.telephone}</p>
                {profil.lieu && (
                  <p className="text-brun">Lieu : {profil.lieu}</p>
                )}
              </>
            )}
            {profilCharge && !profil && (
              <p className="text-brun">
                Tu es connecté avec un compte sans profil client.
              </p>
            )}

            <a
              href="/"
              className="block text-center bg-noir text-or font-semibold rounded-lg w-full py-3 mt-6"
            >
              Aller à la boutique
            </a>
            <button
              onClick={seDeconnecter}
              className="bg-creme hover:bg-or/20 text-noir rounded-lg w-full py-3 mt-3"
            >
              Déconnexion
            </button>
          </div>

          {/* Historique */}
          <div className="flex items-center justify-between mt-8 mb-3">
            <h2 className="text-xl font-bold">
              Mes commandes ({commandes.length})
            </h2>
            <button
              onClick={() => {
                chargerCommandes(userId);
                chargerAvis(userId);
              }}
              className="text-sm bg-white shadow rounded-lg px-3 py-1.5"
            >
              Actualiser
            </button>
          </div>

          {commandes.length === 0 && (
            <p className="text-brun">
              Tu n&apos;as pas encore passé de commande.
            </p>
          )}

          {commandes.map((c) => {
            const st = STATUTS[c.statut] || {
              texte: c.statut,
              classe: "bg-gray-100 text-gray-700",
            };
            const produitsANoter = c.articles.filter(
              (a, i, arr) =>
                a.produit_id &&
                arr.findIndex((x) => x.produit_id === a.produit_id) === i
            );

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl shadow border border-or/20 p-4 mb-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">Commande n°{c.id}</p>
                    <p className="text-xs text-brun">
                      {new Date(c.created_at).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={
                      "text-xs font-semibold rounded-full px-3 py-1 " +
                      st.classe
                    }
                  >
                    {st.texte}
                  </span>
                </div>

                <div className="mt-3 text-sm">
                  {c.articles.map((a, i) => (
                    <p key={i} className="mb-1">
                      {a.qte} x <b>{a.nom}</b>
                      {a.pointure && ` · pointure ${a.pointure}`}
                      {a.couleur && ` · ${a.couleur}`}
                    </p>
                  ))}
                  <p className="font-bold text-or-fonce mt-2">
                    Total : {c.total} FCFA
                  </p>
                </div>

                {c.statut === "livree" && produitsANoter.length > 0 && (
                  <div className="mt-4 border-t border-or/20 pt-4">
                    <p className="font-semibold mb-3">
                      Donne ton avis sur ta commande
                    </p>

                    {produitsANoter.map((a) => {
                      const cle = `${c.id}-${a.produit_id}`;
                      const b = lireBrouillon(cle);
                      const existant = avisParCle[cle];
                      const msg = messages[cle];

                      return (
                        <div
                          key={cle}
                          className="bg-creme rounded-xl p-3 mb-3"
                        >
                          <p className="font-medium mb-1">{a.nom}</p>
                          <Etoiles
                            valeur={b.etoiles}
                            onChange={(n) => majBrouillon(cle, "etoiles", n)}
                          />
                          <textarea
                            placeholder="Ton commentaire (facultatif)"
                            value={b.commentaire}
                            onChange={(e) =>
                              majBrouillon(cle, "commentaire", e.target.value)
                            }
                            rows={2}
                            className={champ + " mt-2 text-sm"}
                          />
                          {msg && (
                            <p
                              className={
                                "text-sm mt-2 font-medium " +
                                (msg.startsWith("Merci")
                                  ? "text-green-700"
                                  : "text-red-700")
                              }
                            >
                              {msg}
                            </p>
                          )}
                          <button
                            onClick={() => envoyerAvis(c, a)}
                            className="bg-noir text-or font-semibold rounded-lg w-full mt-2 py-2"
                          >
                            {existant ? "Modifier mon avis" : "Envoyer mon avis"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </main>
      </div>
    );
  }

  // ----- Inscription / connexion -----
  return (
    <div className="min-h-screen bg-creme text-noir">
      {entete}
      <main className="max-w-lg mx-auto p-4">
        <div className="bg-white rounded-2xl shadow border border-or/30 p-6 mt-6">
          <div className="flex rounded-lg bg-creme p-1 mb-5">
            <button
              onClick={() => {
                setMode("inscription");
                setErreur("");
              }}
              className={
                "flex-1 py-2 rounded-lg font-semibold " +
                (mode === "inscription" ? "bg-noir text-or" : "text-brun")
              }
            >
              Inscription
            </button>
            <button
              onClick={() => {
                setMode("connexion");
                setErreur("");
              }}
              className={
                "flex-1 py-2 rounded-lg font-semibold " +
                (mode === "connexion" ? "bg-noir text-or" : "text-brun")
              }
            >
              Connexion
            </button>
          </div>

          <label className={etiquette}>Nom ou surnom</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Aboubakar"
            className={champ + (mode === "inscription" ? " mb-1" : " mb-4")}
          />
          {mode === "inscription" && (
            <p className="text-xs text-brun mb-4">
              C&apos;est avec lui que tu te connecteras. Il doit être unique.
            </p>
          )}

          {mode === "inscription" && (
            <>
              <label className={etiquette}>Numéro de téléphone</label>
              <div className="flex mb-4">
                <span className="bg-noir text-or font-semibold rounded-l-lg px-3 flex items-center">
                  +225
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0574963117"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className={champ + " rounded-l-none"}
                />
              </div>

              <label className={etiquette}>
                Lieu de livraison habituel (facultatif)
              </label>
              <input
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                placeholder="Quartier, ville"
                className={champ + " mb-4"}
              />
            </>
          )}

          <label className={etiquette}>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className={champ + " mb-4"}
          />

          {erreur && (
            <p className="bg-red-50 text-red-700 rounded-lg p-2 mb-4 text-sm">
              {erreur}
            </p>
          )}

          <button
            onClick={mode === "inscription" ? sInscrire : seConnecter}
            disabled={enCours}
            className="bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg w-full py-3 disabled:opacity-50"
          >
            {enCours
              ? "Patiente..."
              : mode === "inscription"
              ? "Créer mon compte"
              : "Me connecter"}
          </button>
        </div>
      </main>
    </div>
  );
}