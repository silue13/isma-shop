"use client";

import { useEffect, useState } from "react";

type EvenementInstallation = Event & {
  prompt: () => Promise<void>;
};

export default function InstallerApp() {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(
    null
  );
  const [appareil, setAppareil] = useState<"ios" | "android" | "autre">(
    "autre"
  );
  const [installee, setInstallee] = useState(true);
  const [aide, setAide] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstallee(standalone);

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setAppareil("ios");
    else if (/android/.test(ua)) setAppareil("android");

    function avantInstallation(e: Event) {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
    }
    function apresInstallation() {
      setInstallee(true);
      setEvenement(null);
    }

    window.addEventListener("beforeinstallprompt", avantInstallation);
    window.addEventListener("appinstalled", apresInstallation);
    return () => {
      window.removeEventListener("beforeinstallprompt", avantInstallation);
      window.removeEventListener("appinstalled", apresInstallation);
    };
  }, []);

  // Déjà installée, ou ordinateur : rien à afficher
  if (installee || (appareil === "autre" && !evenement)) return null;

  async function installer() {
    if (evenement) {
      await evenement.prompt();
      setEvenement(null);
    } else {
      setAide((a) => !a);
    }
  }

  return (
    <div className="max-w-md mx-auto my-4">
      <button
        onClick={installer}
        className="w-full bg-or hover:bg-or-fonce text-noir font-semibold rounded-lg py-3 flex items-center justify-center gap-2"
      >
        <span aria-hidden>📲</span> Installer l&apos;application
      </button>

      {aide && (
        <div className="bg-white rounded-xl border border-or/30 p-4 mt-2 text-sm text-brun">
          {appareil === "ios" ? (
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Ouvre cette page avec <b>Safari</b>.
              </li>
              <li>
                Touche le bouton <b>Partager</b> (le carré avec une flèche).
              </li>
              <li>
                Choisis <b>Sur l&apos;écran d&apos;accueil</b>, puis{" "}
                <b>Ajouter</b>.
              </li>
            </ol>
          ) : (
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Ouvre cette page avec <b>Chrome</b>.
              </li>
              <li>
                Touche les <b>3 points ⋮</b> en haut à droite.
              </li>
              <li>
                Choisis <b>Installer l&apos;application</b> (ou{" "}
                <b>Ajouter à l&apos;écran d&apos;accueil</b>).
              </li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}