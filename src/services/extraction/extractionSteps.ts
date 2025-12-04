// Multi-step extraction prompts for maximum precision

export const STEP_1_SYSTEM = `Sei un esperto di estrazione dati da gestionali formativi italiani.
In questo step estrai SOLO il calendario, gli orari e la struttura dei moduli.
NON estrarre ID corso/sezione (verranno estratti nello step successivo).
NON estrarre i partecipanti (verranno estratti in uno step dedicato).`;

export const STEP_1_PROMPT = `Analizza i dati forniti e estrai SOLO:

1. STRUTTURA MODULI:
   - Titolo di ogni modulo
   - Tipo (FAD/Presenza/Misto)
   - Ore totali

2. CALENDARIO E SESSIONI per ogni modulo:
   - Data (formato DD/MM/YYYY)
   - Ora inizio (formato HH:MM)
   - Ora fine (formato HH:MM)
   - Se è FAD o presenza

3. INFO BASE CORSO:
   - Titolo
   - Tipo (FAD/Presenza/Misto)
   - Data inizio e fine
   - Ore totali

IMPORTANTE: 
- Se ci sono PIÙ MODULI, crea un oggetto separato per ognuno
- Associa le sessioni al modulo corretto in base alle date
- NON estrarre ID, partecipanti o altri dati`;

export const STEP_2_SYSTEM = `Sei un esperto di estrazione dati da gestionali formativi italiani.
In questo step estrai SOLO gli ID e le informazioni tecniche/anagrafiche.
NON estrarre date, orari o partecipanti.`;

export const STEP_2_PROMPT = `Analizza i dati forniti e estrai SOLO:

1. ID CRITICI (PRIORITÀ MASSIMA):
   - Cerca la tabella "Moduli" o la sezione "Ricerca"
   - Estrai ID Corso (tipicamente 5 cifre, es. 50039)
   - Estrai ID Sezione (tipicamente 6 cifre, es. 144176)
   - IGNORA l'ID nella sezione "Dettagli di base"!

2. INFO CORSO AGGIUNTIVE:
   - ID corso (dalla sezione dettagli)
   - Capienza (formato X/Y)
   - Stato
   - Anno
   - Ore rendicontabili

3. ENTE E SEDE:
   - Nome ente
   - Indirizzo ente
   - Nome sede
   - Indirizzo sede

4. PERSONALE:
   - Trainer: nome completo e codice fiscale
   - Tutor: nome completo e codice fiscale (se presente)
   - Direttore/Supervisore: nome e qualifica

5. IMPOSTAZIONI FAD (se corso FAD):
   - Piattaforma (Teams, Zoom, etc.)
   - Link meeting
   - ID meeting e passcode

ATTENZIONE: Per ogni modulo trovato, fornisci il suo ID Corso e ID Sezione.`;

export const STEP_3_SYSTEM = `Sei un esperto di estrazione dati da gestionali formativi italiani.
In questo step estrai SOLO la lista completa dei partecipanti.`;

export const STEP_3_PROMPT = `Analizza i dati forniti e estrai SOLO la lista COMPLETA dei partecipanti.

Per OGNI partecipante estrai:
- Nome
- Cognome  
- Codice Fiscale (deve essere 16 caratteri)
- Email (se disponibile)
- Telefono (se disponibile)
- Benefits: indica "Sì" se il partecipante è beneficiario GOL/PNRR, altrimenti "No"

IMPORTANTE:
- Estrai TUTTI i partecipanti, non saltarne nessuno
- Verifica che il codice fiscale sia completo (16 caratteri)
- Se trovi indicazioni di "GOL", "PNRR", "beneficiario" o simili, imposta benefits a "Sì"`;
