"use client";

import { useState } from "react";
import { supabase } from "./supabase";
import { emailDepuisNom, nettoyerNumero, slugNom } from "./auth";

export type Profil = { nom: string; telephone: string; lieu: string | null };

const champ =
  "border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or";
const etiquette = "block text-sm font-medium text-brun mb-1";

export default function FormulaireProfil({
  userId,
  profil,
  onChange,
}: {
  userId: string;
  profil: Profil;
  onChange: (p: Profil) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState(profil.nom);
  const [telephone, setTelephone] = useState(profil.telephone);
  const [lieu, setLieu] = useState(profil.lieu || "");
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [mdpActuel, setMdpActuel] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [enCours, setEnCours] = useState(false);

  function ouvrir() {
    setNom(profil.nom);
    setTelephone(profil.telephone);
    setLieu(profil.lieu || "");
    setNouveauMdp("");
    setMdpActuel("");
    setMessage("");
    setOk(false);
    setOuvert(true);
  }

  async function enregistrer() {
    setMessage("");
    setOk(false);

    const nouveauNom = nom.trim();
    const tel = nettoyerNumero(telephone);
    const nomChange = slugNom(nouveauNom) !== slugNom(profil.nom);
    const mdpChange = nouveauMdp.length > 0;

    if (!nouveauNom || !slugNom(nouveauNom))
      return setMessage(
        "Ton nom ou surnom doit contenir des lettres ou des chiffres."
      );
    if (tel.length !== 10)
      return setMessage("Le numéro doit avoir 10 chiffres après +225.");
    if (mdpChange && nouveauMdp.length < 6)
      return setMessage(
        "Le nouveau mot de passe doit avoir au moins 6 caractères."
      );
    if ((nomChange || mdpChange) && !mdpActuel)
      return setMessage(
        "Pour changer ton nom ou ton mot de passe, entre ton mot de passe actuel."
      );

    setEnCours(true);

    if (nomChange || mdpChange) {
      const { error: erreurAuth } = await supabase.auth.signInWithPassword({
        email: emailDepuisNom(profil.nom),
        password: mdpActuel,
      });
      if (erreurAuth) {
        setMessage("Mot de passe actuel incorrect.");
        setEnCours(false);
        return;
      }

      if (nomChange) {
        const { data, error } = await supabase.auth.updateUser({
          email: emailDepuisNom(nouveauNom),
        });
        if (error) {
          const m = error.message.toLowerCase();
          setMessage(
            m.includes("already") || m.includes("registered")
              ? "Ce nom ou surnom est déjà pris. Choisis-en un autre."
              : "Erreur : " + error.message
          );
          setEnCours(false);
          return;
        }
        if (data.user?.new_email) {
          setMessage(
            "Le changement de nom n'est pas encore activé sur la boutique. Préviens le propriétaire."
          );
          setEnCours(false);
          return;
        }
      }

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
    }

    const { error: erreurProfil } = await supabase
      .from("clients")
      .update({ nom: nouveauNom, telephone: tel, lieu: lieu.trim() })
      .eq("user_id", userId);

    if (erreurProfil) {
      setMessage("Erreur : " + erreurProfil.message);
      setEnCours(false);
      return;
    }

    onChange({ nom: nouveauNom, telephone: tel, lieu: lieu.trim() });
    setOk(true);
    setMessage("Informations enregistrées !");
    setNouveauMdp("");
    setMdpActuel("");
    setEnCours(false);
  }

  if (!ouvert) {
    return (
      <button
        onClick={ouvrir}
        className="w-full mt-4 bg-white rounded-2xl shadow border border-or/30 p-4 text-left font-semibold flex items-center justify-between"
      >
        Modifier mes informations
        <span aria-hidden>✎</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-or/30 p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Mes informations</h2>
        <button
          onClick={() => setOuvert(false)}
          className="text-sm bg-creme rounded-lg px-3 py-1.5"
        >
          Fermer
        </button>
      </div>

      <label className={etiquette}>Nom ou surnom</label>
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        className={champ + " mb-1"}
      />
      <p className="text-xs text-brun mb-4">
        C&apos;est ton identifiant de connexion : il doit être unique.
      </p>

      <label className={etiquette}>Numéro de téléphone</label>
      <div className="flex mb-4">
        <span className="bg-noir text-or font-semibold rounded-l-lg px-3 flex items-center">
          +225
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className={champ + " rounded-l-none"}
        />
      </div>

      <label className={etiquette}>Lieu de livraison habituel</label>
      <input
        value={lieu}
        onChange={(e) => setLieu(e.target.value)}
        placeholder="Quartier, ville"
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

        <label className={etiquette}>Mot de passe actuel</label>
        <input
          type="password"
          value={mdpActuel}
          onChange={(e) => setMdpActuel(e.target.value)}
          className={champ + " mb-1"}
        />
        <p className="text-xs text-brun mb-4">
          Nécessaire seulement si tu changes ton nom ou ton mot de passe.
        </p>
      </div>

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