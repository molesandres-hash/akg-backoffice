// Types for AI extraction results

export interface Partecipante {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  email?: string;
  telefono?: string;
}

export interface Sessione {
  data: string; // DD/MM/YYYY
  oraInizio: string; // HH:MM
  oraFine: string; // HH:MM
  argomento?: string;
  sede?: string;
}

export interface Modulo {
  titolo: string;
  dataInizio: string;
  dataFine: string;
  oreTotali: number;
  tipoSede: 'presenza' | 'online' | 'fad' | 'misto';
  provider?: string;
  sessioni: Sessione[];
}

export interface ExtractionResult {
  // Step 1: Calendario e Struttura
  titoloCorso: string;
  oreTotali: number;
  moduli: Modulo[];
  
  // Step 2: ID e Metadati
  idCorso: string;
  idSezione: string;
  ente: string;
  
  // Step 3: Partecipanti
  partecipanti: Partecipante[];
  
  // Metadati addizionali
  docente?: {
    nome: string;
    cognome: string;
  };
  tutor?: {
    nome: string;
    cognome: string;
  };
  sede?: string;
}

export interface CourseData {
  // Dati corso
  titoloCorso: string;
  idCorso: string;
  idSezione: string;
  ente: string;
  oreTotali: number;
  sede: string;
  
  // Persone
  docenteNome: string;
  docenteCognome: string;
  tutorNome: string;
  tutorCognome: string;
  
  // Liste
  partecipanti: Partecipante[];
  sessioni: Sessione[];
  moduli: Modulo[];
}

// Placeholder map for docxtemplater
export interface PlaceholderMap {
  // Globali
  CORSO_TITOLO: string;
  CORSO_ID: string;
  SEZIONE_ID: string;
  ENTE_NOME: string;
  ORE_TOTALI: number;
  SEDE: string;
  
  // Persone
  DOCENTE_NOME: string;
  DOCENTE_COGNOME: string;
  DOCENTE_COMPLETO: string;
  TUTOR_NOME: string;
  TUTOR_COGNOME: string;
  TUTOR_COMPLETO: string;
  
  // Date
  DATA_OGGI: string;
  DATA_INIZIO: string;
  DATA_FINE: string;
  
  // Loop arrays
  STUDENTI: Array<{
    INDEX: number;
    NOME: string;
    COGNOME: string;
    NOME_COMPLETO: string;
    CF: string;
    EMAIL: string;
    TELEFONO: string;
  }>;
  
  LEZIONI: Array<{
    INDEX: number;
    DATA: string;
    ORA_INIZIO: string;
    ORA_FINE: string;
    ARGOMENTO: string;
    SEDE: string;
  }>;
  
  MODULI: Array<{
    INDEX: number;
    TITOLO: string;
    DATA_INIZIO: string;
    DATA_FINE: string;
    ORE: number;
    TIPO_SEDE: string;
  }>;
}
