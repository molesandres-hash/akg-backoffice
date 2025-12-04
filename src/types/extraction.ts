// Types for AI extraction results - Complete data structure

// Offerta Formativa
export interface OffertaFormativa {
  codice: string;
  nome: string;
}

// Ente Accreditato details
export interface EnteAccreditato {
  nome: string;
  via: string;
  numero_civico: string;
  comune: string;
  cap: string;
  provincia: string;
}

// Ente (Organization)
export interface Ente {
  nome: string;
  id: string;
  indirizzo: string;
  logo?: string;
  accreditato: EnteAccreditato;
}

// Sede (Location)
export interface Sede {
  tipo: string;
  nome: string;
  modalita: string;
  indirizzo: string;
}

// Trainer/Tutor/Personnel
export interface Persona {
  nome: string;
  cognome: string;
  nome_completo: string;
  codice_fiscale: string;
  email?: string;
  telefono?: string;
}

// Direttore
export interface Direttore {
  nome_completo: string;
  qualifica: string;
}

// FAD Settings
export interface FadSettings {
  piattaforma: string;
  modalita_gestione: string;
  modalita_valutazione: string;
  obiettivi_didattici: string;
  zoom_meeting_id: string;
  zoom_passcode: string;
  zoom_link: string;
}

// Partecipante
export interface Partecipante {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  email?: string;
  telefono?: string;
  ore_presenza?: number;
  benefits?: boolean; // Flag per beneficiari GOL/PNRR
}

// Responsabile (Supervisore, Resp. Certificazione)
export interface Responsabile {
  nome_completo: string;
  qualifica: string;
}

// Sessione (Session) - Detailed
export interface Sessione {
  numero: number;
  data_completa: string; // DD/MM/YYYY
  giorno: string;
  mese: string;
  mese_numero: string;
  anno: string;
  giorno_settimana: string;
  ora_inizio: string; // HH:MM
  ora_fine: string; // HH:MM
  sede: string;
  tipo_sede: 'presenza' | 'online' | 'fad' | '';
  is_fad: boolean;
  argomento?: string;
  durata?: string;
}

// Modulo (Module)
export interface Modulo {
  titolo: string;
  id: string;
  id_corso: string;
  id_sezione: string;
  argomenti: string[];
  data_inizio: string;
  data_fine: string;
  ore_totali: string;
  ore_rendicontabili: string;
  tipo_sede: string;
  provider: string;
  capienza: string;
  stato: string;
  sessioni: Sessione[];
  sessioni_presenza: Sessione[];
}

// Corso (Course) - Main course info
export interface Corso {
  titolo: string;
  id: string;
  tipo: 'FAD' | 'presenza' | 'misto' | '';
  data_inizio: string;
  data_fine: string;
  durata_totale: string;
  ore_totali: string;
  ore_rendicontabili: string;
  capienza: string;
  capienza_numero: number;
  capienza_totale: number;
  stato: string;
  anno: string;
  programma: string;
  offerta_formativa: OffertaFormativa;
}

// Complete Course Data structure
export interface CourseData {
  corso: Corso;
  moduli: Modulo[];
  sede: Sede;
  ente: Ente;
  trainer: Persona;
  tutor: Persona;
  direttore: Direttore;
  supervisore: Responsabile;
  responsabile_certificazione: Responsabile;
  partecipanti: Partecipante[];
  fad_settings: FadSettings;
  note?: string;
}

// Legacy extraction result (for AI extraction service compatibility)
export interface ExtractionResult {
  corso: Partial<Corso>;
  moduli: Partial<Modulo>[];
  sede: Partial<Sede>;
  ente: Partial<Ente>;
  trainer: Partial<Persona>;
  tutor?: Partial<Persona>;
  direttore?: Partial<Direttore>;
  partecipanti: Partecipante[];
  fad_settings?: Partial<FadSettings>;
}

// Placeholder map for docxtemplater - Extended
export interface PlaceholderMap {
  // Corso - Globali
  NOME_CORSO: string;
  CORSO_TITOLO: string;
  ID_CORSO: string;
  ID_SEZIONE: string;
  DATA_INIZIO: string;
  DATA_FINE: string;
  ORE_TOTALI: string;
  ORE_RENDICONTABILI: string;
  ANNO_CORSO: string;
  TIPO_CORSO: string;
  CAPIENZA: string;
  STATO: string;
  
  // Offerta Formativa
  CODICE_OFFERTA_FORMATIVA: string;
  NOME_OFFERTA_FORMATIVA: string;
  
  // Ente
  ENTE_NOME: string;
  ENTE_INDIRIZZO: string;
  SEDE_ACCREDITATA: string;
  SEDE_ACCREDITATA_COMPLETA: string;
  
  // Sede
  SEDE_NOME: string;
  SEDE_INDIRIZZO: string;
  SEDE_TIPO: string;
  VERBALE_LUOGO: string;
  
  // Persone
  NOME_DOCENTE: string;
  DOCENTE_NOME: string;
  DOCENTE_COGNOME: string;
  DOCENTE_COMPLETO: string;
  CODICE_FISCALE_DOCENTE: string;
  EMAIL_DOCENTE: string;
  TELEFONO_DOCENTE: string;
  
  TUTOR_NOME: string;
  TUTOR_COGNOME: string;
  TUTOR_COMPLETO: string;
  TUTOR_CORSO: string;
  
  DIRETTORE_CORSO: string;
  DIRETTORE_NOME_COMPLETO: string;
  DIRETTORE_QUALIFICA: string;
  SUPERVISORE_NOME_COMPLETO: string;
  SUPERVISORE_QUALIFICA: string;
  RESP_CERT_NOME_COMPLETO: string;
  RESP_CERT_QUALIFICA: string;
  
  // FAD Settings
  PIATTAFORMA: string;
  MODALITA_GESTIONE: string;
  MODALITA_VALUTAZIONE: string;
  OBIETTIVI_DIDATTICI: string;
  ZOOM_MEETING_ID: string;
  ZOOM_PASSCODE: string;
  ZOOM_LINK: string;
  ID_RIUNIONE: string;
  PASSCODE: string;
  ORE_FAD: string;
  ORE_TOTALE_FAD: string;
  NUMERO_PAGINE: string;
  DATA_VIDIMAZIONE: string;
  
  // Modulo corrente (per documenti per-modulo)
  MODULO_TITOLO: string;
  MODULO_ID: string;
  MODULO_ID_SEZIONE: string;
  MODULO_NUMERO: number;
  MODULO_DATA_INIZIO: string;
  MODULO_DATA_FINE: string;
  MODULO_ORE: string;
  MODULO_TIPO_SEDE: string;
  
  // Date
  DATA_OGGI: string;
  GIORNO: string;
  MESE: string;
  ANNO: string;
  
  // Loop arrays
  STUDENTI: Array<{
    INDEX: number;
    NUMERO: number;
    NOME: string;
    COGNOME: string;
    NOME_COMPLETO: string;
    CF: string;
    CODICE_FISCALE: string;
    EMAIL: string;
    TELEFONO: string;
  }>;
  
  PARTECIPANTI: Array<{
    numero: number;
    nome: string;
    cognome: string;
    nome_completo: string;
    codice_fiscale: string;
    email: string;
    telefono: string;
  }>;
  
  SESSIONI: Array<{
    numero: number;
    data: string;
    giorno: string;
    mese: string;
    anno: string;
    ora_inizio: string;
    ora_fine: string;
    durata: string;
    argomento: string;
    sede: string;
    modalita: string;
  }>;
  
  SESSIONI_FAD: Array<{
    numero: number;
    data: string;
    giorno: string;
    mese: string;
    anno: string;
    ora_inizio: string;
    ora_fine: string;
    durata: string;
    PARTECIPANTI_SESSIONE: Array<{
      numero: number;
      nome: string;
      cognome: string;
      nome_completo: string;
      codice_fiscale: string;
      ora_connessione: string;
      ora_disconnessione: string;
    }>;
  }>;
  
  SESSIONI_PRESENZA: Array<{
    numero: number;
    data: string;
    giorno: string;
    mese: string;
    anno: string;
    ora_inizio: string;
    ora_fine: string;
    durata: string;
    sede: string;
  }>;
  
  MODULI: Array<{
    INDEX: number;
    NUMERO: number;
    TITOLO: string;
    ID: string;
    ID_SEZIONE: string;
    DATA_INIZIO: string;
    DATA_FINE: string;
    ORE: string;
    TIPO_SEDE: string;
  }>;
  
  LISTA_ARGOMENTI: Array<{
    argomento: string;
    modulo: string;
    ARGOMENTO: string;
    MODULO: string;
  }>;
}

// Helper to create empty structures
export function createEmptyCorso(): Corso {
  return {
    titolo: '',
    id: '',
    tipo: '',
    data_inizio: '',
    data_fine: '',
    durata_totale: '',
    ore_totali: '',
    ore_rendicontabili: '',
    capienza: '',
    capienza_numero: 0,
    capienza_totale: 0,
    stato: '',
    anno: new Date().getFullYear().toString(),
    programma: '',
    offerta_formativa: { codice: '', nome: '' },
  };
}

export function createEmptyModulo(): Modulo {
  return {
    titolo: '',
    id: '',
    id_corso: '',
    id_sezione: '',
    argomenti: [],
    data_inizio: '',
    data_fine: '',
    ore_totali: '',
    ore_rendicontabili: '',
    tipo_sede: '',
    provider: '',
    capienza: '',
    stato: '',
    sessioni: [],
    sessioni_presenza: [],
  };
}

export function createEmptySessione(): Sessione {
  return {
    numero: 1,
    data_completa: '',
    giorno: '',
    mese: '',
    mese_numero: '',
    anno: '',
    giorno_settimana: '',
    ora_inizio: '',
    ora_fine: '',
    sede: '',
    tipo_sede: '',
    is_fad: false,
    argomento: '',
    durata: '',
  };
}

export function createEmptyEnte(): Ente {
  return {
    nome: '',
    id: '',
    indirizzo: '',
    accreditato: {
      nome: '',
      via: '',
      numero_civico: '',
      comune: '',
      cap: '',
      provincia: '',
    },
  };
}

export function createEmptySede(): Sede {
  return {
    tipo: '',
    nome: '',
    modalita: '',
    indirizzo: '',
  };
}

export function createEmptyPersona(): Persona {
  return {
    nome: '',
    cognome: '',
    nome_completo: '',
    codice_fiscale: '',
    email: '',
    telefono: '',
  };
}

export function createEmptyFadSettings(): FadSettings {
  return {
    piattaforma: 'Microsoft Teams',
    modalita_gestione: 'Sincrona',
    modalita_valutazione: 'Test Scritto',
    obiettivi_didattici: '',
    zoom_meeting_id: '',
    zoom_passcode: '',
    zoom_link: '',
  };
}

export function createEmptyResponsabile(): Responsabile {
  return {
    nome_completo: '',
    qualifica: '',
  };
}

export function createEmptyCourseData(): CourseData {
  return {
    corso: createEmptyCorso(),
    moduli: [createEmptyModulo()],
    sede: createEmptySede(),
    ente: createEmptyEnte(),
    trainer: createEmptyPersona(),
    tutor: createEmptyPersona(),
    direttore: { nome_completo: '', qualifica: '' },
    supervisore: createEmptyResponsabile(),
    responsabile_certificazione: createEmptyResponsabile(),
    partecipanti: [],
    fad_settings: createEmptyFadSettings(),
    note: '',
  };
}
