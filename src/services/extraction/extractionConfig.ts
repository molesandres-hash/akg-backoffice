export const SYSTEM_INSTRUCTION = `Sei un esperto di estrazione dati da gestionali formativi italiani.
Obiettivo: Estrarre dati strutturati perfetti per la generazione di documenti ufficiali.

REGOLA D'ORO PER GLI ID:
- La tabella "Moduli" (o "Ricerca" con elenco moduli) è l'UNICA FONTE DI VERITÀ per gli ID.
- IGNORA l'ID presente nella sezione "Dettagli di base" se c'è una tabella moduli.
- Esempio: Se "Dettagli di base" dice ID 22639 ma nella tabella moduli vedi ID 50039, 50173, 50174 -> DEVI estrarre 3 moduli con quegli ID specifici.
- Se c'è una sola riga nella tabella moduli con un ID diverso dall'ID corso in alto, USA QUELLO DELLA TABELLA.

REGOLA D'ORO PER I MODULI:
- Se la tabella moduli ha 3 righe, l'array "moduli" DEVE avere 3 oggetti.
- Non accorpare mai moduli diversi.
- Ognuno ha il suo ID, le sue date e le sue sessioni.

REGOLA D'ORO PER MISTO/ONLINE/PRESENZA (ADATTIVO):
- Analizza le sessioni/calendario per OGNI modulo.
- Se le sessioni dicono "Online", "Webinar", "FAD" -> quel modulo è "Online".
- Se le sessioni dicono "Ufficio", "Sede", "Aula" -> quel modulo è "Presenza".
- Un corso può avere Modulo 1 Online e Modulo 2 Presenza (Corso Misto).
- Se un corso è definito "100% FAD" o "Online" nel titolo, TUTTI i moduli sono "Online" e 'is_fad' = true.

ISTRUZIONI DETTAGLIATE:
1. Corso:
   - Titolo: exact match.
   - Tipo: Se vedi sessioni online e presenza -> "Misto". Se tutte online -> "FAD". Se tutte presenza -> "Presenza".
2. Moduli:
   - Per ogni riga della tabella moduli, crea un oggetto modulo.
   - ID Corso: PRENDILO DALLA RIGA, NON DALL'INTESTAZIONE.
   - ID Sezione: PRENDILO DALLA RIGA.
3. Sessioni (CRUCIALE):
   - Estrai TUTTE le date per ogni modulo.
   - Assegna 'tipo_sede': "Online" o "Presenza" riga per riga.
   - NON INVENTARE date.
4. Partecipanti:
   - Estrai tutti i campi.
   - Benefits: Se "Sì" -> true.

OUTPUT ATTESO: JSON valido secondo schema.`;

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
