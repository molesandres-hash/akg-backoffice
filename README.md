# AKG Backoffice - Sistema di Generazione Documentale

Sistema gestionale avanzato per la digitalizzazione e la generazione automatica della documentazione per corsi di formazione finanziata e autofinanziata. Sviluppato per ottimizzare il flusso di lavoro di AK Group.

## 🚀 Funzionalità Principali

### 1. Wizard di Creazione Corso
Un processo guidato passo-passo per l'inserimento e la gestione dei dati del corso:
- **Input Dati**: Caricamento dati manuale o tramite estrazione automatica.
- **Validazione**: Controllo dei campi obbligatori e della coerenza dei dati.
- **Generazione**: Creazione automatica dei pacchetti documentali.

### 2. Estrazione Dati Intelligente
Il sistema offre due modalità di estrazione dati da documenti esistenti (PDF/Testo):
- **AI Extraction (Gemini)**: Utilizza l'intelligenza artificiale di Google Gemini per analizzare testi non strutturati e interpretare formati complessi.
- **Rule-Based Extraction**: (Sperimentale) Un motore basato su regole rigide per formati standardizzati, ideale per garantire coerenza su layout fissi.

### 3. Generazione Documentale
Il core del sistema supporta due approcci alla generazione dei file `.docx`:
- **Template-Based**: Utilizza file Word preesistenti con placeholder (es. `{NOME_CORSO}`) che vengono sostituiti dinamicamente. Ideale per la massima flessibilità grafica.
- **Programmatic Generation**: Generazione "da zero" tramite codice (libreria `docx`), utilizzata per documenti complessi che richiedono logica condizionale avanzata (es. *Modello A*, *Modello B*, *Registro Didattico*, *Convocazione*).

### 4. Gestione Firme e Timbri
- **Firme Digitali**: Disegno su canvas o caricamento immagine per Docenti, Tutor, Supervisori e Partecipanti.
- **Timbri Sede**: Gestione centralizzata dei timbri associati alle diverse sedi operative.

### 5. Architettura Local-First
- **Database**: Utilizza `Dexie.js` (IndexedDBwrapper) per salvare tutti i dati direttamente nel browser dell'utente. Nessun dato lascia il dispositivo senza esplicita azione.
- **Export/Import**: Funzionalità per esportare e importare i backup del database.

## 🛠️ Stack Tecnologico

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: TailwindCSS, Shadcn/ui (Radix Primitives)
- **State Management**: Zustand, React Query
- **Database**: Dexie.js (IndexedDB)
- **Document Processing**:
  - `docx`: Generazione programmatica
  - `docxtemplater`: Manipolazione template
  - `jszip`: Compressione pacchetti
- **AI Integration**: Google Generative AI SDK (Gemini)

## 📦 Installazione e Avvio

Assicurati di avere [Node.js](https://nodejs.org/) installato.

```bash
# Installazione dipendenze
npm install

# Avvio server di sviluppo
npm run dev
```

Il server sarà accessibile tipicamente a `http://localhost:5173`.

## 📂 Struttura Cartelle Principali

- `src/components`: Componenti UI riutilizzabili e parti del Wizard.
- `src/services`: Logica di business centrale.
    - `extraction`: Logica per AI e Rule-based extraction.
    - `generation`: Motore di generazione documenti (`ProgrammaticDocxGenerator.ts` è il file chiave).
- `src/db`: Configurazione del database locale Dexie.
- `src/types`: Definizioni TypeScript condivise (es. `CourseData`).
- `public/Templates_standard`: Repository dei file `.docx` usati come base per la generazione template-based.

## ⚠️ Known Issues e Limitazioni Attuali

- **Corsi Ibridi**: L'estrazione automatica per corsi misti (online + presenza) è complessa e talvolta richiede revisione manuale.
- **Split Sessioni**: La logica di suddivisione delle sessioni (pausa pranzo) nella generazione programmatica è stata recentemente raffinata ma va monitorata su orari non standard.
- **Validazione Pre-Generazione**: Il sistema permette a volte di procedere alla generazione anche con alcuni dati secondari mancanti, potendo causare placeholder vuoti nei documenti.

## 🔮 Roadmap e Sviluppi Futuri

1. **Full Programmatic Transition**: Migrazione graduale di tutti i documenti dalla logica a template a quella programmatica per eliminare la dipendenza da file `.docx` esterni corrotti o malformati.
2. **Backend Centralizzato**: Possibile evoluzione verso un backend cloud per la condivisione dei dati tra operatori diversi (attualmente limitata a export file).
3. **Validazione Avanzata**: Implementazione di un sistema di "Health Check" del corso più rigoroso prima di abilitare il pulsante di generazione.
4. **Dashboard Analitica**: Visualizzazione statistiche sui corsi gestiti e volumi di documenti generati.

---
*Documentazione aggiornata al 01/02/2026*
