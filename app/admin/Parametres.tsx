"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

const champ =
  "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";
const etiquette = "block text-sm font-medium text-brun mb-1";

export default function Parametres() {
  const [ouvert, setOuvert] = useState(false);
  const [emailActuel, setEmailActuel] = useState("");
  const [email, setEmail] = useState("");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mdpActuel, setMdpActuel] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email || "";
      setEmailActuel(e);
      setEmail(e);
    });
  }, []);

  async function enregistrer() {
    setMessage("");
    setOk(false);

    const nouvelEmail = email.trim().toLowerCase();
    const emailChange = nouvelEmail !== emailActuel.toLowerCase();
    const mdpChange = nouveauMdp.length > 0;

    if (!emailChange && !mdpChange)
      return setMessage("Tu n'as rien changé.");
    if (emailChange && !nouvelEmail.includes("@"))
      return setMessage("Cette adresse e-mail n'est pas valide.");
    if (mdpChange && nouveauMdp.length < 8)
      return setMessage(
        "Le nouveau mot de passe doit avoir au moins 8 caractères."
      );
    if (mdpChange && nouveauMdp !== confirmation)
      return setMessage("Les deux mots de passe ne sont pas identiques.");
    if (!mdpActuel)
      return setMessage("Entre ton mot de passe actuel pour confirmer.");

    setEnCours(true);

    // 1. Vérifier le mot de passe actuel
    const { error: erreurAuth } = await supabase.auth.signInWithPassword({
      email: emailActuel,
      password: mdpActuel,
    });
    if (erreurAuth) {
      setMessage("Mot de passe actuel incorrect.");
      setEnCours(false);
      return;
    }

    // 2. Changer l'e-mail
    if (emailChange) {
      const { data, error } = await supabase.auth.updateUser({
        email: nouvelEmail,
      });
      if (error) {
        setMessage("Erreur : " + error.message);
        setEnCours(false);
        return;
      }
      if (data.user?.new_email) {
        setMessage(
          "Le changement d'e-mail n'est pas activé : dans Supabase, désactive « Secure email change » (Authentication > Sign In / Providers > Email)."
        );
        setEnCours(false);
        return;
      }
      setEmailActuel(nouvelEmail);
    }

    // 3. Changer le mot de passe
    if (mdpChange) {
      const { error } = await supabase.auth.updateUser({
        password: nouveauMdp,
      });
      if (error) {
        setMessage("Erreur : " + error.message);
        setEnCours(false);
        return;
      }
    }

    setOk(true);
    setMessage("Modifications enregistrées !");
    setNouveauMdp("");
    setConfirmation("");
    setMdpActuel("");
    setEnCours(false);
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="w-full mt-5 bg-white rounded-xl shadow border border-or/20 p-3 text-left font-semibold flex items-center justify-between"
      >
        Mon compte administrateur
        <span aria-hidden>✎</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-or/20 p-5 mt-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Mon compte administrateur</h2>
        <button
          onClick={() => setOuvert(false)}
          className="text-sm bg-creme rounded-lg px-3 py-1.5"
        >
          Fermer
        </button>
      </div>

      <label className={etiquette}>E-mail de connexion</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={champ + " mb-5"}
      />

      <div className="border-t border-or/20 pt-4">
        <p className="font-semibold mb-3">
          Changer mon mot de passe (facultatif)
        </p>

        <label className={etiquette}>Nouveau mot de passe</label>
        <input
          type="password"
          value={nouveauMdp}
          onChange={(e) => setNouveauMdp(e.target.value)}
          className={champ + " mb-3"}
        />

        <label className={etiquette}>Répéter le nouveau mot de passe</label>
        <input
          type="password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className={champ + " mb-4"}
        />
      </div>

      <label className={etiquette}>Mot de passe actuel (pour confirmer)</label>
      <input
        type="password"
        value={mdpActuel}
        onChange={(e) => setMdpActuel(e.target.value)}
        className={champ + " mb-4"}
      />

      {message && (
        <p
          className={
            "rounded-lg p-3 mb-3 text-sm font-medium " +
            (ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")
          }
        >
          {message}
        </p>
      )}

      <button
        onClick={enregistrer}
        disabled={enCours}
        className="bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg w-full py-3 disabled:opacity-50"
      >
        {enCours ? "Patiente..." : "Enregistrer"}
      </button>
    </div>
  );
}