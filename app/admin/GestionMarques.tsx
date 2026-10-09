"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";

type Marque = {
  id: number;
  nom: string;
  image_url: string | null;
  ordre: number;
};

export default function GestionMarques() {
  const [marques, setMarques] = useState<Marque[]>([]);
  const [nom, setNom] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function charger() {
    const { data } = await supabase
      .from("marques")
      .select("id, nom, image_url, ordre")
      .order("ordre")
      .order("nom");
    setMarques((data as Marque[]) || []);
  }

  useEffect(() => {
    charger();
  }, []);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const nomPropre = nom.trim();
    if (!nomPropre) {
      setMessage("Écris le nom de la marque.");
      return;
    }
    setEnCours(true);

    let image_url: string | null = null;
    if (fichier) {
      const extension = fichier.name.split(".").pop() || "png";
      const chemin = `marques/${Date.now()}.${extension}`;
      const { error: errUpload } = await supabase.storage
        .from("produits")
        .upload(chemin, fichier);
      if (errUpload) {
        setMessage("Envoi de l'image impossible : " + errUpload.message);
        setEnCours(false);
        return;
      }
      image_url = supabase.storage.from("produits").getPublicUrl(chemin)
        .data.publicUrl;
    }

    const ordre = marques.length
      ? Math.max(...marques.map((m) => m.ordre)) + 1
      : 1;

    const { error } = await supabase
      .from("marques")
      .insert({ nom: nomPropre, image_url, ordre });

    setEnCours(false);
    if (error) {
      setMessage(
        error.code === "23505"
          ? "Cette marque existe déjà."
          : "Ajout impossible : " + error.message
      );
      return;
    }
    setNom("");
    setFichier(null);
    setMessage("Marque ajoutée ✅");
    charger();
  }

  async function supprimer(m: Marque) {
    if (!window.confirm(`Supprimer la marque « ${m.nom} » ?`)) return;
    const { error } = await supabase.from("marques").delete().eq("id", m.id);
    if (error) {
      setMessage("Suppression impossible : " + error.message);
      return;
    }
    charger();
  }

  return (
    <section className="bg-white rounded-xl border border-or/30 p-4 my-6">
      <h2 className="text-xl font-bold mb-4">Marques affichées sur l&apos;accueil</h2>

      <form onSubmit={ajouter} className="space-y-3 mb-5">
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la marque (ex : Nike)"
          className="border border-or/40 rounded-lg w-full p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-or"
        />
        <div>
          <label className="block text-sm text-brun mb-1">
            Logo de la marque (facultatif)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={enCours}
          className="bg-noir text-or rounded-lg px-5 py-2.5 font-semibold disabled:opacity-50"
        >
          {enCours ? "Patiente..." : "Ajouter la marque"}
        </button>
        {message && <p className="text-sm text-brun">{message}</p>}
      </form>

      {marques.length === 0 && (
        <p className="text-brun text-sm">Aucune marque pour le moment.</p>
      )}

      <ul className="space-y-2">
        {marques.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between border border-or/20 rounded-lg p-2.5"
          >
            <div className="flex items-center gap-3">
              {m.image_url ? (
                <img
                  src={m.image_url}
                  alt={m.nom}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-noir rounded" />
              )}
              <span className="font-semibold">{m.nom}</span>
            </div>
            <button
              onClick={() => supprimer(m)}
              className="text-red-600 text-sm font-semibold"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}