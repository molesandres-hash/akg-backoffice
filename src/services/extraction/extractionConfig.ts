// System instructions and schema configuration for AI extraction

export const SYSTEM_INSTRUCTION = `Sei un esperto di estrazione dati da gestionali formativi italiani.
Analizza i dati forniti e estrai tutte le informazioni relative a:
- Corso (ID, titolo, tipo, date, durata, capienza, stato, programma)
- Moduli/Sezioni (ARRAY - uno o più moduli, ciascuno con: ID, ID Corso, ID Sezione, titolo, date inizio/fine, ore totali, durata, capienza, stato, tipo sede, provider)
- Sede (tipo, nome, modalità, indirizzo)
- Ente erogatore (nome, ID, indirizzo)
- Docenti/trainer (nome completo, codice fiscale se presente)
- Partecipanti (array con ID, nome, cognome, CF, email, telefono, programma, ufficio, case manager, benefits - indicare "Sì" o "No")
- Responsabili (se presenti: responsabile certificazione, direttore, supervisore)
- Dati Verbale (se presenti: data, ora, luogo, tipo prova)
- Info FAD (se presenti: piattaforma, modalità)

IMPORTANTE PER ID CORSO E SEZIONE:
- Cerca la tabella "Moduli" o "Ricerca".
- Dai PRIORITÀ ASSOLUTA alle colonne "ID Corso" e "ID Sezione" presenti nella tabella dei moduli.
- IGNORA l'ID presente nella sezione "Dettagli di base" se differisce da quello nella tabella Moduli (spesso è solo un ID prenotazione interno).
- Esempio: Se "Dettagli di base" dice ID 20641 ma la tabella Moduli dice ID Corso 47816, USA 47816.

IMPORTANTE PER MODULI MULTIPLI:
- Se la tabella moduli contiene PIÙ RIGHE, significa che ci sono PIÙ MODULI/SEZIONI.
- Estrai OGNI riga come un oggetto modulo separato nell'array "moduli".
- Ogni modulo DEVE avere il suo "id_sezione" specifico (spesso diverso per ogni riga).
- NON confondere "Sezioni" (unità didattiche) con "Sessioni" (lezioni/date).

IMPORTANTE PER SESSIONI:
- Ogni modulo ha le SUE date/orari specifici.
- Se le date sono elencate sotto ogni modulo, associale al modulo corretto.
- Se le date sono in un blocco unico ma riferite a moduli diversi, cerca di attribuirle correttamente.

IMPORTANTE GENERALE:
- Se un dato non è presente, usa "" (stringa vuota)
- Per le date usa formato DD/MM/YYYY
- Per gli orari usa formato HH:MM
- Estrai TUTTI i partecipanti dall'elenco
- Per tipo_sede distingui tra "Presenza", "Online", "FAD" quando applicabile
- IMPORTANTE: Se estrai argomenti per i moduli, genera ESATTAMENTE un numero di argomenti pari al numero di giorni di lezione del modulo.`;

export const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    corso: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID del corso dalla sezione dettagli base" },
        titolo: { type: "string", description: "Titolo completo del corso" },
        tipo: { type: "string", description: "Tipo corso: FAD, Presenza, Misto" },
        data_inizio: { type: "string", description: "Data inizio formato DD/MM/YYYY" },
        data_fine: { type: "string", description: "Data fine formato DD/MM/YYYY" },
        durata_totale: { type: "string", description: "Durata totale" },
        ore_totali: { type: "string", description: "Ore totali del corso" },
        ore_rendicontabili: { type: "string", description: "Ore rendicontabili" },
        capienza: { type: "string", description: "Capienza formato X/Y" },
        stato: { type: "string", description: "Stato del corso" },
        anno: { type: "string", description: "Anno del corso" },
        programma: { type: "string", description: "Programma del corso" }
      },
      required: ["titolo"]
    },
    offerta_formativa: {
      type: "object",
      properties: {
        codice: { type: "string", description: "Codice offerta formativa" },
        nome: { type: "string", description: "Nome offerta formativa" }
      }
    },
    moduli: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID univoco del modulo" },
          id_corso: { type: "string", description: "ID Corso dalla tabella Moduli - PRIORITÀ MASSIMA" },
          id_sezione: { type: "string", description: "ID Sezione dalla tabella Moduli - PRIORITÀ MASSIMA" },
          titolo: { type: "string", description: "Titolo del modulo" },
          data_inizio: { type: "string", description: "Data inizio modulo DD/MM/YYYY" },
          data_fine: { type: "string", description: "Data fine modulo DD/MM/YYYY" },
          ore_totali: { type: "string", description: "Durata in ore" },
          durata: { type: "string", description: "Durata modulo" },
          ore_rendicontabili: { type: "string", description: "Ore rendicontabili" },
          capienza: { type: "string", description: "Capienza modulo" },
          stato: { type: "string", description: "Stato modulo" },
          tipo_sede: { type: "string", description: "Online o Presenza" },
          provider: { type: "string", description: "Provider formativo" },
          argomenti: {
            type: "array",
            items: { type: "string" },
            description: "Lista argomenti del modulo"
          },
          sessioni_raw: {
            type: "array",
            items: {
              type: "object",
              properties: {
                data: { type: "string", description: "Data sessione DD/MM/YYYY" },
                ora_inizio: { type: "string", description: "Ora inizio HH:MM" },
                ora_fine: { type: "string", description: "Ora fine HH:MM" },
                sede: { type: "string", description: "Sede della sessione" },
                tipo_sede: { type: "string", description: "Tipo sede sessione" },
                is_fad: { type: "boolean", description: "True se FAD/online" }
              },
              required: ["data", "ora_inizio", "ora_fine"]
            }
          }
        },
        required: ["titolo"]
      }
    },
    sede: {
      type: "object",
      properties: {
        tipo: { type: "string", description: "Tipo sede" },
        nome: { type: "string", description: "Nome sede" },
        modalita: { type: "string", description: "Modalità" },
        indirizzo: { type: "string", description: "Indirizzo completo" }
      }
    },
    ente: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome ente" },
        id: { type: "string", description: "ID ente" },
        indirizzo: { type: "string", description: "Indirizzo ente" }
      }
    },
    trainer: {
      type: "object",
      properties: {
        nome: { type: "string" },
        cognome: { type: "string" },
        nome_completo: { type: "string" },
        codice_fiscale: { type: "string" }
      }
    },
    tutor: {
      type: "object",
      properties: {
        nome: { type: "string" },
        cognome: { type: "string" },
        nome_completo: { type: "string" },
        codice_fiscale: { type: "string" }
      }
    },
    partecipanti: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID partecipante se disponibile" },
          nome: { type: "string", description: "Nome del partecipante" },
          cognome: { type: "string", description: "Cognome del partecipante" },
          codice_fiscale: { type: "string", description: "Codice fiscale 16 caratteri" },
          telefono: { type: "string", description: "Telefono se disponibile" },
          cellulare: { type: "string", description: "Cellulare se disponibile" },
          email: { type: "string", description: "Email se disponibile" },
          programma: { type: "string", description: "Programma partecipante" },
          ufficio: { type: "string", description: "Ufficio di appartenenza" },
          case_manager: { type: "string", description: "Case manager" },
          benefits: { type: "string", description: "Sì o No - beneficiario GOL/PNRR" },
          frequenza: { type: "string", description: "Percentuale frequenza" }
        },
        required: ["nome", "cognome"]
      }
    },
    responsabili: {
      type: "object",
      properties: {
        responsabile_certificazione: {
          type: "object",
          properties: {
            nome: { type: "string" },
            cognome: { type: "string" }
          }
        },
        direttore: {
          type: "object",
          properties: {
            nome: { type: "string" },
            cognome: { type: "string" }
          }
        },
        supervisore: {
          type: "object",
          properties: {
            nome: { type: "string" },
            cognome: { type: "string" }
          }
        }
      }
    },
    verbale: {
      type: "object",
      properties: {
        data: { type: "string", description: "Data verbale DD/MM/YYYY" },
        ora: { type: "string", description: "Ora verbale HH:MM" },
        luogo: { type: "string", description: "Luogo verbale" },
        tipo_prova: { type: "string", description: "Tipo prova" },
        descrizione_prova: { type: "string", description: "Descrizione prova" }
      }
    },
    fad_info: {
      type: "object",
      properties: {
        piattaforma: { type: "string", description: "Nome piattaforma FAD" },
        modalita_gestione: { type: "string", description: "Modalità gestione" },
        modalita_valutazione: { type: "string", description: "Modalità valutazione" },
        id_riunione: { type: "string", description: "ID riunione" },
        passcode: { type: "string", description: "Passcode" },
        link: { type: "string", description: "Link alla piattaforma/meeting" }
      }
    },
    direttore: {
      type: "object",
      properties: {
        nome_completo: { type: "string" },
        qualifica: { type: "string" }
      }
    }
  },
  required: ["corso", "moduli", "partecipanti"]
};

// Simplified schema for specific extraction steps
export const STEP1_SCHEMA = {
  type: "object",
  properties: {
    moduli: EXTRACTION_SCHEMA.properties.moduli,
    corso: {
      type: "object",
      properties: {
        titolo: { type: "string" },
        tipo: { type: "string" },
        data_inizio: { type: "string" },
        data_fine: { type: "string" },
        ore_totali: { type: "string" }
      }
    }
  },
  required: ["moduli"]
};

export const STEP2_SCHEMA = {
  type: "object",
  properties: {
    corso: {
      type: "object",
      properties: {
        id: { type: "string" },
        capienza: { type: "string" },
        stato: { type: "string" },
        anno: { type: "string" },
        ore_rendicontabili: { type: "string" }
      }
    },
    moduli_ids: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titolo: { type: "string" },
          id: { type: "string" },
          id_corso: { type: "string" },
          id_sezione: { type: "string" }
        },
        required: ["id_corso", "id_sezione"]
      }
    },
    ente: EXTRACTION_SCHEMA.properties.ente,
    sede: EXTRACTION_SCHEMA.properties.sede,
    trainer: EXTRACTION_SCHEMA.properties.trainer,
    tutor: EXTRACTION_SCHEMA.properties.tutor,
    direttore: EXTRACTION_SCHEMA.properties.direttore,
    fad_settings: EXTRACTION_SCHEMA.properties.fad_info
  },
  required: ["moduli_ids"]
};

export const STEP3_SCHEMA = {
  type: "object",
  properties: {
    partecipanti: EXTRACTION_SCHEMA.properties.partecipanti
  },
  required: ["partecipanti"]
};
