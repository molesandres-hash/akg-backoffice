# Guida Completa ai Placeholder e Template

> [!IMPORTANT]
> **REGOLA FONDAMENTALE:** Usa sempre e solo **SINGOLA parentesi graffa** `{...}`.
> - ✅ `{NOME_CORSO}`
> - ❌ `{{NOME_CORSO}}`

---

## 1. Dati Generali del Corso
Questi placeholder sono disponibili ovunque nel documento.

| Placeholder | Descrizione | Esempio Output |
| :--- | :--- | :--- |
| `{TITOLO_CORSO}` | Titolo completo del corso | "Corso Avanzato Sicurezza" |
| `{ID_CORSO}` | ID univoco del corso | "1024" |
| `{ID_SEZIONE}` | ID della sezione (se presente) | "A1" |
| `{DATA_INIZIO}` | Data inizio corso | "01/01/2024" |
| `{DATA_FINE}` | Data fine corso | "31/12/2024" |
| `{ORE_TOTALI}` | Durata totale | "40" |
| `{ANNO_CORSO}` | Anno di riferimento | "2024" |
| `{TIPO_CORSO}` | Tipologia corso | "FAD" / "Residenziale" |
| `{CAPIENZA}` | Num. max partecipanti | "20" |
| `{STATO}` | Stato del corso | "Attivo" |

---

## 2. Ente e Sede
| Placeholder | Descrizione |
| :--- | :--- |
| `{ENTE_NOME}` | Nome dell'ente organizzatore |
| `{ENTE_INDIRIZZO}` | Indirizzo completo dell'ente |
| `{SEDE_NOME}` | Nome della sede del corso |
| `{SEDE_INDIRIZZO}` | Indirizzo della sede |
| `{SEDE_ACCREDITATA}` | Nome sede accreditata (se presente) |
| `{SEDE_ACCREDITATA_COMPLETA}` | Indirizzo completo sede accreditata |

---

## 3. Staff Didattico
| Placeholder | Descrizione |
| :--- | :--- |
| `{NOME_DOCENTE}` | Nome e cognome docente principale |
| `{DOCENTE_NOME}` | Solo nome docente |
| `{DOCENTE_COGNOME}` | Solo cognome docente |
| `{EMAIL_DOCENTE}` | Email docente |
| `{TELEFONO_DOCENTE}` | Telefono docente |
| `{CODICE_FISCALE_DOCENTE}` | CF docente |
| `{TUTOR_COMPLETO}` | Nome completo tutor |
| `{DIRETTORE_CORSO}` | Nome completo direttore corso |

---

## 4. Dati FAD (Formazione a Distanza)
Specifici per corsi e-learning/Zoom.

| Placeholder | Descrizione |
| :--- | :--- |
| `{PIATTAFORMA}` | Piattaforma usata (es. Zoom) |
| `{ZOOM_LINK}` | Link diretto alla riunione |
| `{ID_RIUNIONE}` | Meeting ID |
| `{PASSCODE}` | Password riunione |
| `{ORE_FAD}` | Totale ore in FAD |
| `{ORE_PRESENZA}` | Totale ore in Presenza |

---

## 5. Partecipanti (Posizionali)
Se hai bisogno di creare un elenco fisso (senza loop) per i primi X partecipanti. Funziona per qualsiasi numero (es. sostituire X con 1, 2, 3...).

| Placeholder | Descrizione |
| :--- | :--- |
| `{PARTECIPANTE_1_COMPLETO}` | Nome cognome partecipante 1 |
| `{PARTECIPANTE_1_CF}` | Codice Fiscale partecipante 1 |
| `{PARTECIPANTE_1_EMAIL}` | Email partecipante 1 |
| `{PARTECIPANTE_2_COMPLETO}` | Nome cognome partecipante 2 |
| ... e così via ... | |

---

## 6. Loop e Tabelle Dinamiche
Queste sono le funzioni più potenti. Permettono di generare un elenco di lunghezza variabile (es. righe di una tabella).

### Loop Partecipanti
Crea una riga per ogni studente iscritto.

**Sintassi nel template:**
```text
{#PARTECIPANTI}
   {nome} {cognome} - {codice_fiscale}
{/PARTECIPANTI}
```

**Variabili disponibili dentro il loop `{#PARTECIPANTI}`:**
- `{numero}` (1, 2, 3...)
- `{nome}`
- `{cognome}`
- `{nome_completo}`
- `{codice_fiscale}`
- `{email}`
- `{telefono}`

---

### Loop Sessioni (Calendario)
Crea una lista di tutte le lezioni.

**Sintassi nel template:**
```text
{#SESSIONI}
   Lezione {numero}: {data} dalle {ora_inizio} alle {ora_fine} ({durata} ore)
   Argomento: {argomento}
{/SESSIONI}
```

**Variabili disponibili dentro il loop `{#SESSIONI}`:**
- `{numero}`
- `{data}` (es. 12/05/2024)
- `{giorno}`, `{mese}`, `{anno}` (singoli componenti data)
- `{ora_inizio}`, `{ora_fine}`
- `{durata}` (in ore)
- `{argomento}`
- `{modalita}` ("FAD" o "Presenza")
- `{sede}`

---

### Loop Sessioni FAD (Specifico)
Solo per le lezioni online. Contiene un sotto-loop per i partecipanti presenti (utile per Registri FAD).

**Sintassi nel template:**
```text
{#SESSIONI_FAD}
   DATA: {data}  ORARIO: {ora_inizio}-{ora_fine}
   
   ELENCO PRESENTI:
   {#PARTECIPANTI_SESSIONE}
      {numero}. {nome_completo} (Entrata: {ora_connessione} - Uscita: {ora_disconnessione})
   {/PARTECIPANTI_SESSIONE}
   -----------------------------------
{/SESSIONI_FAD}
```

---

## 7. Strumenti Utili
- **`check_templates.py`**: Lancia questo script per controllare se i tuoi file DOCX contengono errori (es. doppie graffe).
- **`convert_braces.py`**: Lancia questo script per convertire automaticamente le doppie graffe `{{...}}` in singole `{...}` in una cartella.
