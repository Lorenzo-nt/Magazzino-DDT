"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { jsPDF } from "jspdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function MagazzinoCloud() {
  const [user, setUser] = useState<{email: string} | null>(null);
  const [scannedData, setScannedData] = useState<string>("");
  const [form, setForm] = useState({ qta: 1, destinazione: "" });

  useEffect(() => {
    if (user && !scannedData) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
      scanner.render((text) => {
        setScannedData(text);
        scanner.clear().catch(console.error);
      }, (err) => { /* Silenzio errori camera */ });
      return () => { 
        scanner.clear().catch(() => {}); 
      };
    }
  }, [user, scannedData]);

  const salvaDDT = async () => {
    if (!user || !scannedData) return;

    // 1. Recupero l'ultimo numero DDT
    const { data: ultimi } = await supabase
      .from('documenti_trasporto')
      .select('numero_ddt')
      .order('numero_ddt', { ascending: false })
      .limit(1);

    const prossimoNumero = ultimi && ultimi[0] ? ultimi[0].numero_ddt + 1 : 1;

    // 2. Preparo l'oggetto (nomi colonne identici a database)
    const nuovoDDT = {
      numero_ddt: prossimoNumero,
      prodotto: scannedData,
      quantita: Number(form.qta),
      destinazione: form.destinazione,
      utente_email: user.email
    };

    // 3. Invio i dati a Supabase
    const { error } = await supabase.from('documenti_trasporto').insert([nuovoDDT]);

    if (error) {
      alert("Errore Supabase: " + error.message);
    } else {
      generaPDF(nuovoDDT);
      alert("DDT Salvato!");
      setScannedData("");
    }
  };
      alert("Errore Supabase: " + error.message);
    } else {
      generaPDF(nuovoDDT);
      alert("DDT Salvato!");
      setScannedData("");
    }
      quantita: Number(form.qta),
      destinazione: form.destinazione,
      utente_email: user.email
    };

    // 3. Invio i dati (Riga 46 corretta senza simboli extra)
    const { error } = await supabase.from('documenti_trasporto').insert([nuovoDDT]);

    if (error) {
      alert("Errore Supabase: " + error.message);
    } else {
      generaPDF(nuovoDDT);
      alert("DDT Salvato!");
      setScannedData("");
    }
  };
    } else {
      generaPDF(nuovoDDT);
      alert("DDT Salvato!");
      setScannedData("");
    }
  };

  const generaPDF = (dati: any) => {
    const doc = new jsPDF();
    doc.text("documenti_trasporto", 20, 20);
    doc.text(`Prodotto: ${dati.prodotto}`, 20, 40);
    doc.text(`Qta: ${dati.quantita}`, 20, 50);
    doc.save(`DDT_${dati.numero_ddt}.pdf`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button onClick={() => setUser({ email: "lorenzo@test.it" })} className="p-4 bg-blue-500 text-white rounded">
          Accedi come Lorenzo
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4">Operatore: {user.email}</h1>
      {!scannedData ? <div id="reader"></div> : (
        <div className="border p-4">
          <p>Scansionato: {scannedData}</p>
          <input type="number" value={form.qta} onChange={e => setForm({...form, qta: +e.target.value})} className="border m-2 p-1" />
          <input type="text" placeholder="Destinazione" onChange={e => setForm({...form, destinazione: e.target.value})} className="border m-2 p-1" />
          <button onClick={salvaDDT} className="bg-green-500 text-white p-2 rounded">Salva</button>
        </div>
      )}
    </div>
  );
}