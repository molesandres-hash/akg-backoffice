// Seed data for initial database population
import { db, setSystemTemplate, type SystemTemplateType, getSystemTemplate } from './templateDb';

export async function seedDefaultData() {
  // Ente predefinito - AK Group S.r.l
  const akGroupId = await db.enti.add({
    nome: "AK Group S.r.l",
    indirizzo: "Corso di Porta Romana 122, 20122 Milano (MI)",
    isDefault: true
  });

  // Sedi predefinite per AK Group
  const sedi = [
    { nome: "Sede Legale", indirizzo: "Corso di Porta Romana 122", citta: "Milano", cap: "20122", provincia: "MI" },
    { nome: "Varese", indirizzo: "Via Walter Marcobi 4", citta: "Varese", cap: "21100", provincia: "VA" },
    { nome: "Milano Stazione Centrale", indirizzo: "Via Recanate 2", citta: "Milano", cap: "20124", provincia: "MI" },
    { nome: "Milano Porta Venezia", indirizzo: "Viale Vittorio Veneto 20", citta: "Milano", cap: "20124", provincia: "MI" },
    { nome: "Milano Decembrio", indirizzo: "Via Pier Candido Decembrio 28", citta: "Milano", cap: "20137", provincia: "MI" }
  ];

  for (const sede of sedi) {
    await db.sedi.add({ ...sede, enteId: akGroupId, isDefault: sede.nome === "Sede Legale" });
  }

  // Offerte Formative GOL
  await db.offerteFormative.bulkAdd([
    { codice: "1020", nome: "GOL - Offerta per Formazione mirata all'inserimento lavorativo", descrizione: "Formazione in presenza" },
    { codice: "1540", nome: "GOL - FAD 100% - Offerta per Formazione mirata all'inserimento lavorativo", descrizione: "Formazione a distanza" }
  ]);

  // Responsabile Certificazione predefinito
  await db.responsabiliCertificazione.add({
    nome: "Gianfranco",
    cognome: "Torre",
    dataNascita: "12/03/1976",
    luogoNascita: "Milano (MI)",
    residenza: "Via Example 1, Milano",
    documento: "CA12345AA",
    isDefault: true
  });

  // Supervisore predefinito
  await db.supervisori.add({
    nome: "Andrea",
    cognome: "Hubbard",
    qualifica: "Supervisore",
    isDefault: true
  });

  // Piattaforme FAD
  await db.piattaforme.bulkAdd([
    { nome: "Zoom", linkBase: "", isDefault: false },
    { nome: "Microsoft Teams", linkBase: "", isDefault: true },
    { nome: "Google Meet", linkBase: "", isDefault: false }
  ]);

  // Docente predefinito
  await db.docenti.add({
    nome: "Andres",
    cognome: "Moles",
    codiceFiscale: "MLSNRS97S25F205C",
    email: "",
    telefono: "",
    isDefault: true
  });

  console.log('✅ Dati predefiniti inizializzati');
  console.log('✅ Dati predefiniti inizializzati');
}

// Mappa dei template di sistema standard
const STANDARD_TEMPLATES: Partial<Record<SystemTemplateType, string>> = {
  'modello_a_fad': '/Templates_standard/Modello_A_FAD_Template.docx',
  'modello_b_fad': '/Templates_standard/modello_B_FAD_template.docx',
  'certificato': '/Templates_standard/Attestato_con_placeholder.docx',
  'calendario_condizionalita': '/Templates_standard/Calendario_condizionalita_FINALE.docx',
  'verbale_ammissione': '/Templates_standard/Verbale_Template_Dinamico.docx',
  'comunicazione_evento': '/Templates_standard/Comunicazione_evento_SESSIONE.docx',
  'registro_presenza': '/Templates_standard/registro_head.docx',
  'registro_giornaliero': '/Templates_standard/registro_pagina_giorno.docx'
};

export async function seedSystemTemplates() {
  console.log('🔄 [Seed] Verifica template di sistema...');

  for (const [type, path] of Object.entries(STANDARD_TEMPLATES)) {
    try {
      // Controlla se il template esiste già
      // FIX: Se esiste già un template per questo tipo, NON sovrascriverlo mai,
      // anche se ha un nome diverso. Questo preserva i template caricati dall'utente.
      const existing = await getSystemTemplate(type as SystemTemplateType);

      if (existing) {
        // console.log(`✅ Template ${type} già presente (preservato utente/esistente)`);
        continue;
      }

      console.log(`📥 Caricamento/Aggiornamento template standard: ${type} da ${path}`);

      // Fetch del file dalla directory public
      const response = await fetch(path);
      if (!response.ok) {
        console.error(`❌ Impossibile caricare ${path}: ${response.statusText}`);
        continue;
      }

      const blob = await response.blob();
      const filename = path.split('/').pop() || `${type}.docx`;

      // Salva nel DB
      await setSystemTemplate(type as SystemTemplateType, blob, filename);
      console.log(`✅ Template ${type} salvato con successo`);

    } catch (error) {
      console.error(`❌ Errore durante il seeding del template ${type}:`, error);
    }
  }
}

// Verifica e seed al primo avvio
export async function initializeDefaultData() {
  try {
    // Controlla tutte le tabelle principali - se una è vuota, inizializza tutto

    const [entiCount, sediCount, offerteCount, docentiCount] = await Promise.all([
      db.enti.count(),
      db.sedi.count(),
      db.offerteFormative.count(),
      db.docenti.count()
    ]);

    // Esegui sempre il seed dei template di sistema se mancano
    await seedSystemTemplates();

    console.log('📊 [Seed] Conteggi DB:', { entiCount, sediCount, offerteCount, docentiCount });

    // Se almeno una tabella critica è vuota, pulisci e ri-inizializza tutto
    if (entiCount === 0 || sediCount === 0 || offerteCount === 0) {
      console.log('🔄 [Seed] Tabelle vuote rilevate, inizializzazione dati predefiniti...');
      // Pulisci prima per evitare duplicati
      await Promise.all([
        db.enti.clear(),
        db.sedi.clear(),
        db.offerteFormative.clear(),
        db.responsabiliCertificazione.clear(),
        db.supervisori.clear(),
        db.piattaforme.clear(),
        db.docenti.clear()
      ]);
      await seedDefaultData();
    } else {
      console.log('✅ [Seed] Dati predefiniti già presenti');
    }
  } catch (error) {
    console.error('❌ [Seed] Errore durante inizializzazione:', error);
  }
}
