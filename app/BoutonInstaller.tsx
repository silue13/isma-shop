"use client";
import { useEffect, useState } from "react";

export default function BoutonInstaller() {
  const [evt, setEvt] = useState<any>(null);

  useEffect(() => {
    const f = (e: any) => { e.preventDefault(); setEvt(e); };
    window.addEventListener("beforeinstallprompt", f);
    return () => window.removeEventListener("beforeinstallprompt", f);
  }, []);

  if (!evt) return null;
  return (
    <button
      onClick={() => { evt.prompt(); setEvt(null); }}
      className="bg-black text-white px-4 py-2 rounded-full text-sm"
    >
      📲 Installer l'application
    </button>
  );
}