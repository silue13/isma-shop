"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Parametres from "./Parametres";
import GestionMarques from "./GestionMarques";

type Produit = {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  prix_barre: number | null;
  stock: number | null;
  categorie: string | null;
  photos: string[];
  pointures: string[];
  couleurs: string[];
  actif: boolean;
};

type Article = {
  nom: string;
  prix: number;
  pointure: string;
  couleur: string;
  qte: number;
};

type Commande = {
  id: number;
  nom: string;
  telephone: string;
  lieu: string;
  articles: Article[];
  total: number;
  statut: string;
  created_at: string;
};

const STATUTS: Record<string, { texte: string; classe: string }> = {
  en_attente: { texte: "En attente", classe: "bg-yellow-100 text-yellow-800" },
  confirmee: { texte: "Confirmée", classe: "bg-blue-100 text-blue-800" },
  livree: { texte: "Livrée", classe: "bg-green-100 text-green-800" },
  annulee: { texte: "Annulée", classe: "bg-red-100 text-red-700" },
};

function versListe(texte: string): string[] {
  return texte
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

// Réduit la photo (1200 px max, JPEG 80 %) avant l'envoi pour que la boutique reste rapide
async function compresserImage(
  f: File,
  maxCote = 1200,
  qualite = 0.8
): Promise<File> {
  try {
    if (!f.type.startsWith("image/") || f.type === "image/gif") return f;
    const bitmap = await createImageBitmap(f);
    const echelle = Math.min(
      1,
      maxCote / Math.max(bitmap.width, bitmap.height)
    );
    const w = Math.round(bitmap.width * echelle);
    const h = Math.round(bitmap.height * echelle);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return f;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resoudre) =>
      canvas.toBlob(resoudre, "image/jpeg", qualite)
    );
    if (!blob || blob.size >= f.size) return f;
    return new File([blob], f.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return f;
  }
}

const champ =
  "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";
const etiquette = "block text-sm font-medium text-brun mb-1";

export default function Admin() {
  const [verification, setVerification] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [estAdmin, setEstAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState<"commandes" | "produits">("commandes");

  const [produits, setProduits] = useState<Produit[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);

  // Formulaire produit
  const [editionId, setEditionId] = useState<number | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [prixBarre, setPrixBarre] = useState("");
  const [stock, setStock] = useState("");
  const [categorie, setCategorie] = useState("");
  const [pointures, setPointures] = useState("");
  const [couleurs, setCouleurs] = useState("");
  const [photosExistantes, setPhotosExistantes] = useState<string[]>([]);
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [cleFichier, setCleFichier] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");

  // Bannière promo
  const [bandeau, setBandeau] = useState("");
  const [messageBandeau, setMessageBandeau] = useState("");

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

  useEffect(() => {
    if (!userId) {
      setEstAdmin(null);
      return;
    }
    supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setEstAdmin(!!data));
  }, [userId]);

  async function chargerProduits() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProduits((data as Produit[]) || []);
  }

  async function chargerCommandes() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setCommandes((data as Commande[]) || []);
  }

  async function chargerBandeau() {
    const { data } = await supabase
      .from("reglages")
      .select("valeur")
      .eq("cle", "bandeau")
      .maybeSingle();
    setBandeau(data?.valeur || "");
  }

  useEffect(() => {
    if (estAdmin) {
      chargerProduits();
      chargerCommandes();
      chargerBandeau();
    }
  }, [estAdmin]);

  async function seConnecter() {
    setErreur("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    if (error) setErreur("E-mail ou mot de passe incorrect");
  }

  async function seDeconnecter() {
    await supabase.auth.signOut();
  }

  async function changerStatut(id: number, statut: string) {
    const { error } = await supabase
      .from("orders")
      .update({ statut })
      .eq("id", id);
    if (error) alert("Erreur : " + error.message);
    chargerCommandes();
  }

  async function sauverBandeau() {
    setMessageBandeau("");
    const { error } = await supabase
      .from("reglages")
      .upsert({ cle: "bandeau", valeur: bandeau.trim() });
    setMessageBandeau(
      error ? "Erreur : " + error.message : "Bannière enregistrée !"
    );
  }

  function reinitialiserFormulaire() {
    setEditionId(null);
    setNom("");
    setDescription("");
    setPrix("");
    setPrixBarre("");
    setStock("");
    setCategorie("");
    setPointures("");
    setCouleurs("");
    setPhotosExistantes([]);
    setFichiers([]);
    setCleFichier((k) => k + 1);
  }

  function commencerModification(p: Produit) {
    setEditionId(p.id);
    setNom(p.nom);
    setDescription(p.description || "");
    setPrix(String(p.prix));
    setPrixBarre(p.prix_barre ? String(p.prix_barre) : "");
    setStock(p.stock !== null && p.stock !== undefined ? String(p.stock) : "");
    setCategorie(p.categorie || "");
    setPointures((p.pointures || []).join(", "));
    setCouleurs((p.couleurs || []).join(", "));
    setPhotosExistantes(p.photos || []);
    setFichiers([]);
    setCleFichier((k) => k + 1);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function enregistrerProduit() {
    setMessage("");

    const prixNum = parseInt(prix, 10);
    if (!nom.trim() || isNaN(prixNum)) {
      setMessage("Le nom et le prix sont obligatoires.");
      return;
    }
    let prixBarreNum: number | null = null;
    if (prixBarre.trim() !== "") {
      prixBarreNum = parseInt(prixBarre, 10);
      if (isNaN(prixBarreNum) || prixBarreNum <= prixNum) {
        setMessage("Le prix barré doit être plus grand que le prix.");
        return;
      }
    }
    let stockNum: number | null = null;
    if (stock.trim() !== "") {
      stockNum = parseInt(stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        setMessage("Le stock doit être un nombre (0 ou plus).");
        return;
      }
    }

    setEnCours(true);

    // 1. Compresser puis envoyer les nouvelles photos
    const urls: string[] = [];
    for (let i = 0; i < fichiers.length; i++) {
      const f = await compresserImage(fichiers[i]);
      const ext = f.name.split(".").pop();
      const chemin = `${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage
        .from("produits")
        .upload(chemin, f, { cacheControl: "31536000" });
      if (error) {
        setMessage("Erreur photo : " + error.message);
        setEnCours(false);
        return;
      }
      const { data } = supabase.storage.from("produits").getPublicUrl(chemin);
      urls.push(data.publicUrl);
    }

    const donnees = {
      nom: nom.trim(),
      description,
      prix: prixNum,
      prix_barre: prixBarreNum,
      stock: stockNum,
      categorie,
      photos: [...photosExistantes, ...urls],
      pointures: versListe(pointures),
      couleurs: versListe(couleurs),
    };

    // 2. Enregistrer
    let erreurEnreg = null;
    if (editionId !== null) {
      const { error } = await supabase
        .from("products")
        .update(donnees)
        .eq("id", editionId);
      erreurEnreg = error;

      // Supprimer du stockage les photos retirées
      if (!error) {
        const originales =
          produits.find((p) => p.id === editionId)?.photos || [];
        const retirees = originales
          .filter((u) => !photosExistantes.includes(u))
          .map((u) => u.split("/produits/")[1])
          .filter(Boolean);
        if (retirees.length > 0) {
          await supabase.storage.from("produits").remove(retirees);
        }
      }
    } else {
      const { error } = await supabase
        .from("products")
        .insert({ ...donnees, actif: true });
      erreurEnreg = error;
    }

    if (erreurEnreg) {
      setMessage("Erreur : " + erreurEnreg.message);
    } else {
      setMessage(
        editionId !== null
          ? "Produit modifié avec succès !"
          : "Produit ajouté avec succès !"
      );
      reinitialiserFormulaire();
      chargerProduits();
    }
    setEnCours(false);
  }

  async function supprimerProduit(p: Produit) {
    if (!confirm(`Supprimer "${p.nom}" ?`)) return;
    const chemins = (p.photos || [])
      .map((u) => u.split("/produits/")[1])
      .filter(Boolean);
    if (chemins.length > 0) {
      await supabase.storage.from("produits").remove(chemins);
    }
    await supabase.from("products").delete().eq("id", p.id);
    if (editionId === p.id) reinitialiserFormulaire();
    chargerProduits();
  }

  async function changerVisibilite(p: Produit) {
    await supabase.from("products").update({ actif: !p.actif }).eq("id", p.id);
    chargerProduits();
  }

  const estErreur = /^(Erreur|Le nom|Le prix|Le stock)/.test(message);
  const nbEnAttente = commandes.filter((c) => c.statut === "en_attente").length;

  if (verification) {
    return (
      <main className="min-h-screen bg-creme p-6 text-brun">Chargement...</main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-creme flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-sm border border-or/30">
          <h1 className="text-2xl font-bold tracking-widest text-noir mb-1">
            ISMA&apos;STORE
          </h1>
          <p className="text-brun mb-6">Espace administrateur</p>

          <label className={etiquette}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={champ + " mb-4"}
          />

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
            onClick={seConnecter}
            className="bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg w-full py-2.5"
          >
            Se connecter
          </button>
        </div>
      </main>
    );
  }

  if (estAdmin === null) {
    return (
      <main className="min-h-screen bg-creme p-6 text-brun">Vérification...</main>
    );
  }

  if (!estAdmin) {
    return (
      <main className="min-h-screen bg-creme flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-sm border border-or/30 text-center">
          <h1 className="text-xl font-bold mb-2">Accès refusé</h1>
          <p className="text-brun mb-6">
            Cet espace est réservé au propriétaire de la boutique.
          </p>
          <a
            href="/"
            className="block bg-noir text-or font-semibold rounded-lg py-3 mb-3"
          >
            Retour à la boutique
          </a>
          <button
            onClick={seDeconnecter}
            className="bg-creme rounded-lg w-full py-3"
          >
            Déconnexion
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-creme text-noir">
      <header className="bg-noir text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-widest text-or">
              ISMA&apos;STORE
            </h1>
            <p className="text-white/60 text-sm">Espace administrateur</p>
          </div>
          <div className="flex gap-2 items-center">
            <a
              href="/"
              className="text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2"
            >
              Voir la boutique
            </a>
            <button
              onClick={seDeconnecter}
              className="text-sm bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg px-3 py-2"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
                <Parametres />
        <div className="flex rounded-xl bg-white shadow p-1 my-5">
          <button
            onClick={() => setOnglet("commandes")}
            className={
              "flex-1 py-2.5 rounded-lg font-semibold " +
              (onglet === "commandes" ? "bg-noir text-or" : "text-brun")
            }
          >
            Commandes
            {nbEnAttente > 0
              ? ` (${nbEnAttente} nouvelle${nbEnAttente > 1 ? "s" : ""})`
              : ""}
          </button>
          <button
            onClick={() => setOnglet("produits")}
            className={
              "flex-1 py-2.5 rounded-lg font-semibold " +
              (onglet === "produits" ? "bg-noir text-or" : "text-brun")
            }
          >
            Produits
          </button>
        </div>

        {/* ONGLET COMMANDES */}
        {onglet === "commandes" && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">
                Commandes ({commandes.length})
              </h2>
              <button
                onClick={chargerCommandes}
                className="text-sm bg-white shadow rounded-lg px-3 py-1.5"
              >
                Actualiser
              </button>
            </div>

            {commandes.length === 0 && (
              <p className="text-brun">Aucune commande pour le moment.</p>
            )}

            {commandes.map((c) => {
              const st = STATUTS[c.statut] || {
                texte: c.statut,
                classe: "bg-gray-100 text-gray-700",
              };
              return (
                <div
                  key={c.id}
                  className="bg-white shadow rounded-2xl p-4 mb-3 border border-or/20"
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
                    <p>
                      👤 <b>{c.nom}</b>
                    </p>
                    <p>📞 {c.telephone}</p>
                    <p>📍 {c.lieu}</p>
                  </div>

                  <div className="mt-3 border-t border-or/20 pt-3 text-sm">
                    {c.articles.map((a, i) => (
                      <p key={i} className="mb-1">
                        {a.qte} x <b>{a.nom}</b>
                        {a.pointure && ` · pointure ${a.pointure}`}
                        {a.couleur && ` · ${a.couleur}`}
                        <span className="text-brun">
                          {" "}
                          — {a.prix * a.qte} FCFA
                        </span>
                      </p>
                    ))}
                    <p className="font-bold text-or-fonce mt-2">
                      Total : {c.total} FCFA
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {c.statut === "en_attente" && (
                      <button
                        onClick={() => changerStatut(c.id, "confirmee")}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg px-3 py-1.5 text-sm font-medium"
                      >
                        Confirmer
                      </button>
                    )}
                    {(c.statut === "en_attente" || c.statut === "confirmee") && (
                      <button
                        onClick={() => changerStatut(c.id, "livree")}
                        className="bg-green-50 hover:bg-green-100 text-green-800 rounded-lg px-3 py-1.5 text-sm font-medium"
                      >
                        Livrée ✓
                      </button>
                    )}
                    {c.statut !== "livree" && c.statut !== "annulee" && (
                      <button
                        onClick={() => {
                          if (confirm("Annuler cette commande ?"))
                            changerStatut(c.id, "annulee");
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-1.5 text-sm font-medium"
                      >
                        Annuler
                      </button>
                    )}
                    <a
                      href={`https://wa.me/225${c.telephone}`}
                      target="_blank"
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium"
                    >
                      WhatsApp client
                    </a>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ONGLET PRODUITS */}
        {onglet === "produits" && (
          <>
            {/* Bannière promo */}
            <section className="bg-white shadow rounded-2xl p-5 mb-6 border border-or/20">
              <h2 className="text-lg font-bold mb-1">Bannière promo</h2>
              <p className="text-sm text-brun mb-3">
                Texte affiché en haut de la boutique. Laisse vide pour ne rien
                afficher.
              </p>
              <input
                placeholder="Ex : -50% de réduction aujourd'hui !"
                value={bandeau}
                onChange={(e) => setBandeau(e.target.value)}
                className={champ}
              />
              {messageBandeau && (
                <p
                  className={
                    "text-sm mt-2 font-medium " +
                    (messageBandeau.startsWith("Erreur")
                      ? "text-red-700"
                      : "text-green-700")
                  }
                >
                  {messageBandeau}
                </p>
              )}
              <button
                onClick={sauverBandeau}
                className="bg-noir text-or font-semibold rounded-lg w-full mt-3 py-2.5"
              >
                Enregistrer la bannière
              </button>
            </section>

            {/* Marques affichées sur l'accueil */}
            <GestionMarques />

            {/* Formulaire produit */}
            <section className="bg-white shadow rounded-2xl p-5 mb-6 border border-or/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {editionId !== null
                    ? "Modifier le produit"
                    : "Ajouter un produit"}
                </h2>
                {editionId !== null && (
                  <button
                    onClick={() => {
                      reinitialiserFormulaire();
                      setMessage("");
                    }}
                    className="text-sm bg-creme rounded-lg px-3 py-1.5"
                  >
                    Annuler
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className={etiquette}>Nom du produit *</label>
                  <input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={champ}
                  />
                </div>
                <div>
                  <label className={etiquette}>Prix de vente (FCFA) *</label>
                  <input
                    type="number"
                    placeholder="35000"
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    className={champ}
                  />
                </div>
                <div>
                  <label className={etiquette}>
                    Ancien prix barré (promo, facultatif)
                  </label>
                  <input
                    type="number"
                    placeholder="55000"
                    value={prixBarre}
                    onChange={(e) => setPrixBarre(e.target.value)}
                    className={champ}
                  />
                </div>
                <div>
                  <label className={etiquette}>
                    Stock (facultatif, vide = non suivi)
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className={champ}
                  />
                </div>
                <div>
                  <label className={etiquette}>Catégorie</label>
                  <input
                    placeholder="Baskets"
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className={champ}
                  />
                </div>
                <div>
                  <label className={etiquette}>
                    Pointures (séparées par des virgules)
                  </label>
                  <input
                    placeholder="40, 41, 42"
                    value={pointures}
                    onChange={(e) => setPointures(e.target.value)}
                    className={champ}
                  />
                </div>
                <div>
                  <label className={etiquette}>
                    Couleurs (séparées par des virgules)
                  </label>
                  <input
                    placeholder="Noir, Blanc"
                    value={couleurs}
                    onChange={(e) => setCouleurs(e.target.value)}
                    className={champ}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={etiquette}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={champ}
                    rows={4}
                  />
                </div>
              </div>

              {photosExistantes.length > 0 && (
                <>
                  <label className={etiquette}>Photos actuelles</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {photosExistantes.map((u) => (
                      <div key={u} className="relative">
                        <img
                          src={u}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() =>
                            setPhotosExistantes((prev) =>
                              prev.filter((x) => x !== u)
                            )
                          }
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-sm leading-none"
                          aria-label="Retirer la photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <label className={etiquette}>
                {editionId !== null
                  ? "Ajouter d'autres photos"
                  : "Photos (tu peux en choisir plusieurs)"}
              </label>
              <input
                key={cleFichier}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFichiers(Array.from(e.target.files || []))}
                className="mb-1 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-or/20 file:text-noir file:px-4 file:py-2 file:font-semibold"
              />
              {fichiers.length > 0 && (
                <p className="text-sm text-brun mb-3">
                  {fichiers.length} photo(s) choisie(s)
                </p>
              )}

              {message && (
                <p
                  className={
                    "rounded-lg p-3 my-3 text-sm font-medium " +
                    (estErreur
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700")
                  }
                >
                  {message}
                </p>
              )}

              <button
                onClick={enregistrerProduit}
                disabled={enCours}
                className="bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg w-full py-3 mt-3 disabled:opacity-50"
              >
                {enCours
                  ? "Envoi en cours..."
                  : editionId !== null
                  ? "Enregistrer les modifications"
                  : "Ajouter le produit"}
              </button>
            </section>

            {/* Liste des produits */}
            <section className="mb-10">
              <h2 className="text-lg font-bold mb-3">
                Mes produits ({produits.length})
              </h2>
              {produits.length === 0 && (
                <p className="text-brun">Aucun produit pour le moment.</p>
              )}
              {produits.map((p) => (
                <div
                  key={p.id}
                  className="bg-white shadow rounded-2xl p-3 mb-3 flex items-center gap-3 border border-or/20"
                >
                  {p.photos?.[0] ? (
                    <img
                      src={p.photos[0]}
                      alt={p.nom}
                      loading="lazy"
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-creme rounded-xl" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{p.nom}</p>
                    <p className="font-bold text-or-fonce">
                      {p.prix_barre && (
                        <span className="text-brun line-through font-normal mr-2">
                          {p.prix_barre}
                        </span>
                      )}
                      {p.prix} FCFA
                    </p>
                    {p.stock !== null && p.stock !== undefined && (
                      <p
                        className={
                          "text-xs mt-0.5 " +
                          (p.stock === 0 ? "text-red-600 font-semibold" : "text-brun")
                        }
                      >
                        {p.stock === 0 ? "Épuisé" : `Stock : ${p.stock}`}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.pointures?.map((x) => (
                        <span
                          key={x}
                          className="text-xs bg-creme text-noir rounded px-2 py-0.5"
                        >
                          {x}
                        </span>
                      ))}
                      {p.couleurs?.map((x) => (
                        <span
                          key={x}
                          className="text-xs bg-or/20 text-noir rounded px-2 py-0.5"
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                    {!p.actif && (
                      <p className="text-xs text-red-600 mt-1">
                        Masqué dans la boutique
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => commencerModification(p)}
                      className="bg-noir text-or rounded-lg px-3 py-1.5 text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => changerVisibilite(p)}
                      className="bg-creme hover:bg-or/20 rounded-lg px-3 py-1.5 text-sm"
                    >
                      {p.actif ? "Masquer" : "Afficher"}
                    </button>
                    <button
                      onClick={() => supprimerProduit(p)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}