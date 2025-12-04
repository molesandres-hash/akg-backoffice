// Seed data for initial database population
import { db } from './templateDb';

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
}

// Verifica e seed al primo avvio
export async function initializeDefaultData() {
  try {
    const entiCount = await db.enti.count();
    if (entiCount === 0) {
      await seedDefaultData();
    }
  } catch (error) {
    console.error('Errore durante inizializzazione dati predefiniti:', error);
  }
}
