// System instructions and schema configuration for AI extraction

export const SYSTEM_INSTRUCTION = `Sei un esperto di estrazione dati da gestionali formativi italiani.
Analizza i dati forniti e estrai TUTTE le informazioni relative a:
- Corso (ID, titolo, tipo, date, ore, capienza, stato)
- Moduli (ID, ID Corso, ID Sezione, titolo, sessioni con date e orari)
- Partecipanti (ID, nome, cognome, codice fiscale, email, benefits)
- Trainer (nome completo, codice fiscale)
- Ente (nome, ID, indirizzo)
- Sede (nome, indirizzo, tipo)
- Tutor (se presente)
- Direttore/Supervisore (se presente)

REGOLE CRITICHE PER ID CORSO E ID SEZIONE:
1. Cerca SEMPRE la tabella "Moduli" o la sezione "Ricerca"
2. Dai PRIORITÀ ASSOLUTA alle colonne "ID Corso" e "ID Sezione" in queste tabelle
3. IGNORA completamente l'ID presente nella sezione "Dettagli di base" - è un ID diverso!
4. L'ID Corso è tipicamente un numero a 5 cifre (es. 50039)
5. L'ID Sezione è tipicamente un numero a 6 cifre (es. 144176)

REGOLE PER MODULI MULTIPLI:
1. Se la tabella moduli contiene PIÙ RIGHE, significa che ci sono PIÙ MODULI
2. Estrai OGNI riga come un oggetto modulo separato nell'array "moduli"
3. Ogni modulo ha il proprio ID, ID Corso e ID Sezione
4. Le sessioni vanno associate al modulo corretto in base alle date

REGOLE PER SESSIONI:
1. Estrai tutte le date e orari dal calendario
2. Formato data: DD/MM/YYYY
3. Formato ora: HH:MM
4. Indica se la sessione è FAD (online) o in presenza

REGOLE PER PARTECIPANTI:
1. Estrai TUTTI i partecipanti dalla lista
2. Il codice fiscale deve essere di 16 caratteri
3. Campo "benefits" indica se il partecipante è beneficiario GOL/PNRR ("Sì" o "No")

OUTPUT: Rispondi SOLO con JSON valido, senza testo aggiuntivo.`;

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
        ore_totali: { type: "string", description: "Ore totali del corso" },
        ore_rendicontabili: { type: "string", description: "Ore rendicontabili" },
        capienza: { type: "string", description: "Capienza formato X/Y" },
        stato: { type: "string", description: "Stato del corso" },
        anno: { type: "string", description: "Anno del corso" }
      },
      required: ["titolo"]
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
          ore_totali: { type: "string", description: "Durata in ore" },
          tipo_sede: { type: "string", description: "Online o Presenza" },
          sessioni_raw: {
            type: "array",
            items: {
              type: "object",
              properties: {
                data: { type: "string", description: "Data sessione DD/MM/YYYY" },
                ora_inizio: { type: "string", description: "Ora inizio HH:MM" },
                ora_fine: { type: "string", description: "Ora fine HH:MM" },
                is_fad: { type: "boolean", description: "True se FAD/online" }
              },
              required: ["data", "ora_inizio", "ora_fine"]
            }
          }
        },
        required: ["titolo", "sessioni_raw"]
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
          email: { type: "string", description: "Email se disponibile" },
          telefono: { type: "string", description: "Telefono se disponibile" },
          benefits: { type: "string", description: "Sì o No - beneficiario GOL/PNRR" }
        },
        required: ["nome", "cognome"]
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
    direttore: {
      type: "object",
      properties: {
        nome_completo: { type: "string" },
        qualifica: { type: "string" }
      }
    },
    ente: {
      type: "object",
      properties: {
        id: { type: "string" },
        nome: { type: "string" },
        indirizzo: { type: "string" }
      }
    },
    sede: {
      type: "object",
      properties: {
        nome: { type: "string" },
        indirizzo: { type: "string" },
        tipo: { type: "string", description: "Online o indirizzo fisico" }
      }
    },
    fad_settings: {
      type: "object",
      properties: {
        piattaforma: { type: "string", description: "Nome piattaforma FAD" },
        link: { type: "string", description: "Link alla piattaforma/meeting" },
        meeting_id: { type: "string" },
        passcode: { type: "string" }
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
    fad_settings: EXTRACTION_SCHEMA.properties.fad_settings
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
