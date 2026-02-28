"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { jsPDF } from "jspdf";

// Sostituisci questi valori con quelli presi da Supabase
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
        scanner.clear();
      }, () => {});
      return () => { scanner.clear().catch(() => {}); };
    }
  }, [user, scannedData]);

  const salvaDDT = async () => {
    if (!user) return;

    // Recupero l'ultimo numero DDT per incrementarlo
    const { data: ultimi } = await supabase
      .from('documenti_trasporto')
      .select('numero_ddt')
      .order('numero_ddt', { ascending: false })
      .limit(1);

    const prossimoNumero = ultimi && ultimi[0] ? ultimi[0].numero_ddt + 1 : 1;

    const nuovoDDT = {
      numero_ddt: prossimoNumero,
      prodotto: scannedData,
      quantita: form.qta,
      destinazione: form.destinazione,
      utente_email: user.email
    };

    const { error } = await supabase.from('documenti_trasporto').insert([nuovoDDT]);

    if (error) {
      alert("Errore nel salvataggio: " + error.message);
    } else {
      generaPDF(nuovoDDT);
      alert("DDT Salvato e PDF in download!");
      setScannedData("");
    }
  };

  const generaPDF = (dati: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Documento di Trasporto (DDT)", 20, 20);
    doc.setFontSize(12);
    doc.text(`Numero: ${dati.numero_ddt}`, 20, 40);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 50);
    doc.text(`Prodotto: ${dati.prodotto}`, 20, 70);
    doc.text(`Quantità: ${dati.quantita}`, 20, 80);
    doc.text(`Destinazione: ${dati.destinazione}`, 20, 90);
    doc.text(`Operatore: ${dati.utente_email}`, 20, 110);
    doc.save(`DDT_${dati.numero_ddt}.pdf`);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Gestione Magazzino</h1>
        <button 
          onClick={() => setUser({ email: "lorenzo@test.it" })}
          className="bg