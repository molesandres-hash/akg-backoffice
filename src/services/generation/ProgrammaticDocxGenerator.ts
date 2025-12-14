import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
    Header,
    ImageRun,
    Footer,
    PageNumber,
    NumberFormat,
    PageOrientation,
    VerticalAlign,
    ISectionOptions
} from "docx";
import { CourseData, Sessione, Partecipante } from "@/types/extraction";

// --- Constants & Styles ---
const FONT_FAMILY = "Calibri";
const FONT_SIZE_TITLE = 28; // 14pt
const FONT_SIZE_HEADING = 24; // 12pt
const FONT_SIZE_BODY = 22; // 11pt
const FONT_SIZE_SMALL = 18; // 9pt
const GREEN_TITLE_COLOR = "00B050"; // Green for Verbale title
const GRAY_BANNER_COLOR = "D9D9D9"; // Light gray
const YELLOW_HIGHLIGHT_COLOR = "FFFF00"; // Yellow for mandatory fields


// Helper to create a standard document with header/footer
export class ProgrammaticDocxGenerator {

    // --- HELPERS ---
    private splitSessionByLunch(session: Sessione): Sessione[] {
        if (!session.ora_inizio || !session.ora_fine) return [session];
        const [startH, startM] = session.ora_inizio.split(':').map(Number);
        const [endH, endM] = session.ora_fine.split(':').map(Number);

        const startMinutes = startH * 60 + (startM || 0);
        const endMinutes = endH * 60 + (endM || 0);
        const lunchStart = 13 * 60; // 13:00
        const lunchEnd = 14 * 60;   // 14:00

        // If session is fully before or fully after lunch, return as is
        if (endMinutes <= lunchStart || startMinutes >= lunchEnd) {
            return [session];
        }

        const result: Sessione[] = [];
        // Morning part
        if (startMinutes < lunchStart) {
            result.push({
                ...session,
                ora_fine: "13:00"
            });
        }
        // Afternoon part
        if (endMinutes > lunchEnd) {
            result.push({
                ...session,
                ora_inizio: "14:00"
            });
        }
        return result;
    }

    private async fetchImage(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${url}`);
        }
        return await response.arrayBuffer();
    }

    // --- MODELLO A GENERATION ---
    public async generateModelloA(data: CourseData): Promise<Blob> {
        // 1. Fetch Header Image
        let headerImageBuffer: ArrayBuffer | null = null;
        try {
            headerImageBuffer = await this.fetchImage('/Templates_standard/86e2d75c-adbe-4e9d-8afa-25b423f5e444.png');
        } catch (e) {
            console.error("Could not load header image", e);
        }

        // Prepare ID string
        const idSezione = data.moduli.find(m => m.id_sezione)?.id_sezione || 'N/D';
        const idLine = `Id corso ${data.corso.id}    ID sezione ${idSezione}`;

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: { orientation: PageOrientation.LANDSCAPE }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            headerImageBuffer ? new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: headerImageBuffer,
                                        transformation: { width: 600, height: 60 },
                                        type: "png"
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }) : new Paragraph({ text: "[HEADER IMAGE MISSING]", alignment: AlignmentType.CENTER }),
                        ],
                    }),
                },
                footers: {
                    default: this.createFooter(),
                },
                children: [
                    // --- Modello A Title ---
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Modello A)",
                                bold: true,
                                size: FONT_SIZE_TITLE,
                                font: FONT_FAMILY
                            }),
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 100 }
                    }),

                    // --- TITLE BANNER ---
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "PRESENTAZIONE ATTIVITA’ DI FORMAZIONE IN MODALITA’ E-LEARNING",
                                                        bold: true,
                                                        size: FONT_SIZE_BODY, // 11pt
                                                        font: FONT_FAMILY
                                                    }),
                                                ],
                                                alignment: AlignmentType.CENTER,
                                            })
                                        ],
                                        shading: { fill: "D0CECE" }, // Slightly darker gray for main title if desired, or keep light gray
                                        borders: this.getThickBorders(), // Should be "Bordo singolo nero spesso" roughly
                                        verticalAlign: AlignmentType.CENTER,
                                        margins: { top: 100, bottom: 100, left: 100, right: 100 }
                                    })
                                ]
                            })
                        ],
                    }),

                    new Paragraph({ text: "", spacing: { after: 200 } }),

                    // --- 1. DATI IDENTIFICATIVI ---
                    // The description says: The entire section (from title to fields) is in a rectangular box relative to the title? 
                    // Or Title is outside, and box starts? 
                    // "Riquadro Sezione: L'intera sezione (dal titolo ai campi 'Passcode') è contenuta in un Riquadro rettangolare con bordo singolo nero."
                    // This implies a large table cell containing the title and the content.

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: this.getSimpleBorders(),
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({ text: "1. DATI IDENTIFICATIVI", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                                                ],
                                                spacing: { before: 100, after: 100 },
                                            }),

                                            // Nested table for fields to control formatting better? Or just paragraphs?
                                            // Requirement: "Alcuni campi presentano un'Evidenziazione Sfondo Giallo"
                                            // Only the value or the whole line? "Etichette... Valori..."
                                            // Usually in these forms, it's a table with LABEL | VALUE cols, or just lines.
                                            // The schema user gave: 
                                            // {"etichetta": "Numero di ore in FAD...", "valore": "xx", "sfondo": "Giallo Chiaro"}
                                            // Let's use a nested table for the fields to allow cell shading. 
                                            // Actually, one main table for the section, and inside we can have rows or a nested table.
                                            // Let's use a nested table for the data points to align them nicely and apply shading.

                                            this.createDataSectionTable(data, idLine),

                                            new Paragraph({ text: "", spacing: { after: 100 } })
                                        ],
                                        borders: {
                                            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                                        }
                                        // We want the border AROUND this cell, which is the section border.
                                        // Wait, if I set table borders, every cell gets them unless overridden.
                                        // Let's make the outer table have the border, and this cell has no internal borders if possible, 
                                        // OR just put the content directly.
                                        // Simpler: Just render the content. The "Section Box" is the table border.
                                    })
                                ]
                            })
                        ]
                    }),


                    // --- 2. Strumenti ---
                    new Paragraph({ text: "", spacing: { after: 200 } }),

                    // Title outside box? 
                    // "2. ... è inserito in un Riquadro rettangolare vuoto... sotto il titolo della sezione"
                    // So Title -> Box with content.
                    new Paragraph({
                        children: [
                            new TextRun({ text: "2. Strumenti e modalità di gestione del servizio in modalità e-learning", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { before: 100, after: 100 },
                    }),
                    this.createContentBox(data.fad_settings.piattaforma || "Zoom"),

                    // --- 3. Moduli (Topics) ---
                    new Paragraph({
                        children: [
                            new TextRun({ text: "3. Moduli realizzati in modalità e-learning e obiettivi di apprendimento rispetto alle unità formative del percorso", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { before: 200, after: 100 },
                    }),
                    this.createContentBox(this.getTopicsString(data), true), // Big box

                    // --- 4. Modalità di valutazione ---
                    new Paragraph({
                        children: [
                            new TextRun({ text: "4. Modalità di valutazione dell'apprendimento durante il percorso in modalità e-learning", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { before: 200, after: 100 },
                    }),
                    this.createContentBox(data.fad_settings.modalita_valutazione || "Scritto"),

                    // Sessions Table
                    new Paragraph({
                        children: [new TextRun({ text: "5. Calendario delle lezioni e-learning, modalità utilizzata e docenti impegnati", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })],
                        spacing: { before: 200, after: 100 },
                    }),
                    this.createFadSessionsTable(data),

                    // --- 6. Partecipanti ---
                    new Paragraph({
                        children: [
                            new TextRun({ text: "6. ELENCO PARTECIPANTI", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { before: 200, after: 100 },
                        pageBreakBefore: true, // Force start on new page
                    }),

                    this.createParticipantsTable(data),

                    // --- Footer / Signature ---
                    new Paragraph({ text: "", spacing: { after: 400 } }),
                    new Paragraph({
                        children: [new TextRun({ text: "IL DIRETTORE DEL CORSO", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })],
                        alignment: AlignmentType.RIGHT, // "Allineato a Destra"
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: "....................................................", size: FONT_SIZE_BODY, font: FONT_FAMILY })],
                        alignment: AlignmentType.RIGHT,
                    }),
                ],
            }],
        });

        return await Packer.toBlob(doc);
    }

    // --- MODELLO B GENERATION ---
    public async generateModelloB(data: CourseData, includeSignature: boolean): Promise<Blob> {
        // Collect ALL FAD sessions
        const allFadSessionsPlain = data.moduli.flatMap(m => m.sessioni.filter(s => s.is_fad));
        if (allFadSessionsPlain.length === 0) {
            // Create a dummy doc or throw? Throwing might break zip. Return empty doc.
            return await Packer.toBlob(new Document({ sections: [] }));
        }

        // Load Header Image
        let headerImageBuffer: ArrayBuffer | null = null;
        try {
            headerImageBuffer = await this.fetchImage('/Templates_standard/86e2d75c-adbe-4e9d-8afa-25b423f5e444.png');
        } catch (e) { console.error("Could not load header image", e); }

        // Load Signature Image if requested
        let signatureImageBuffer: ArrayBuffer | null = null;
        if (includeSignature) {
            try {
                // Try to load from standard location
                signatureImageBuffer = await this.fetchImage('/Templates_standard/firma_docente.png');
            } catch (e) {
                console.warn("Signature image not found at /Templates_standard/firma_docente.png");
            }
        }

        const sections: ISectionOptions[] = [];

        // Loop through each "Raw" session, apply split logic, and create a section for each PART (or each day?)
        // User wants "SCHEDA GIORNO". If a day has morning and afternoon, should it be one page?
        // User said: "(MODELLO B)... Ora di connessione ci deve essere ora inizio lezione mattutina e lezione pomeridiana."
        // AND "come vedi in materia dovrebbe mettere il nome del corso... poi devi ricordarti che le lezioni hanno pausa pranzo e devi mettere quindi separate in righe diverse"
        // It seems for Modello B, they want the table to have rows for Morning and Afternoon IF they exist.
        // So ONE SHEET per Day/Session, but inside the table, we list the parts.

        for (const session of allFadSessionsPlain) {
            const splitSessions = this.splitSessionByLunch(session);

            // Create ONE section per original session (assuming 1 session = 1 day logic in current data)
            // If data has multiple sessions per day, we might need to group by day.
            // But existing logic seemed to treat them individually. Let's keep 1 session = 1 Doc Section.

            sections.push({
                properties: {
                    page: {
                        size: { orientation: PageOrientation.LANDSCAPE }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            headerImageBuffer ? new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: headerImageBuffer,
                                        transformation: { width: 800, height: 80 }, // Wider for landscape
                                        type: "png"
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }) : new Paragraph({ text: "[HEADER IMAGE MISSING]", alignment: AlignmentType.CENTER }),
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "NOTE", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "(1) In caso di attività finanziata al posto del logo di Regione Lombardia vanno inseriti i loghi istituzionali del bando/Avviso di riferimento. In caso di attività autofinanziata va lasciato il logo di Regione Lombardia",
                                        size: 14,
                                        font: FONT_FAMILY
                                    })
                                ]
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "(2) La firma deve essere apposta dallo stesso soggetto che firma giornalmente il registro didattico e delle presenze, deve essere indicato nome e cognome in stampatello e apporre il timbro dell'ente accreditato",
                                        size: 14,
                                        font: FONT_FAMILY
                                    })
                                ]
                            }),
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [
                                    new TextRun({
                                        children: ["Pagina ", PageNumber.CURRENT, " di ", PageNumber.TOTAL_PAGES],
                                        font: FONT_FAMILY,
                                        size: FONT_SIZE_SMALL,
                                    }),
                                ],
                            }),
                        ]
                    })
                },
                children: [
                    // Title Section
                    new Paragraph({
                        children: [
                            new TextRun({ text: "MODELLO B) (1)", bold: true, size: FONT_SIZE_TITLE, font: FONT_FAMILY })
                        ],
                        spacing: { after: 100 }
                    }),
                    // Boxed Title
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: "REGISTRO FORMATIVO E DELLE PRESENZE ONLINE",
                                                        bold: true,
                                                        size: FONT_SIZE_BODY,
                                                        font: FONT_FAMILY
                                                    }),
                                                ],
                                                alignment: AlignmentType.CENTER,
                                            })
                                        ],
                                        shading: { fill: GRAY_BANNER_COLOR },
                                        borders: this.getThickBorders(),
                                        verticalAlign: AlignmentType.CENTER,
                                        margins: { top: 100, bottom: 100, left: 100, right: 100 }
                                    })
                                ]
                            })
                        ],
                    }),
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "SCHEDA GIORNO", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })
                        ],
                        spacing: { after: 100 }
                    }),
                    // Table with Split Sessions
                    this.createModelloBTable(data, session, splitSessions),
                    new Paragraph({ text: "", spacing: { after: 400 } }),
                    // Signature
                    this.createSignatureSection(data, signatureImageBuffer),
                ]
            });
        }

        const doc = new Document({
            sections: sections
        });

        return await Packer.toBlob(doc);
    }

    // --- CONVOCAZIONE BENEFICIARIO GENERATION (FILLED) ---
    public async generateConvocazione(data: CourseData, partecipante: Partecipante): Promise<Blob> {
        // Load Header Image
        let headerImageBuffer: ArrayBuffer | null = null;
        try {
            headerImageBuffer = await this.fetchImage('/Header/logo_finanziatori.png');
        } catch (e) {
            console.error("Could not load header image", e);
        }

        // Prepare Variables
        let supervisorName = "....................";
        let supervisorSurname = "....................";

        if (data.supervisore?.nome_completo) {
            const parts = data.supervisore.nome_completo.trim().split(" ");
            if (parts.length > 0) {
                supervisorSurname = parts.pop() || "";
                supervisorName = parts.join(" ");
            }
        } else if (data.tutor?.nome) {
            supervisorName = data.tutor.nome;
            supervisorSurname = data.tutor.cognome;
        }

        const supervisorEmail = `${supervisorName}.${supervisorSurname}@akgitalia.it`.toLowerCase().replace(/\s+/g, '');
        // Generate Session Rows for the Calendar
        const sessionRows: TableRow[] = [];
        const allSessions = data.moduli.flatMap(m => m.sessioni).sort((a, b) => {
            const da = new Date(a.data_completa.split('/').reverse().join('-'));
            const db = new Date(b.data_completa.split('/').reverse().join('-'));
            return da.getTime() - db.getTime();
        });

        const sessionsByDate: Record<string, { morning: string[], afternoon: string[], hours: number, docenti: Set<string> }> = {};

        for (const session of allSessions) {
            if (!sessionsByDate[session.data_completa]) {
                sessionsByDate[session.data_completa] = { morning: [], afternoon: [], hours: 0, docenti: new Set() };
            }
            const dayData = sessionsByDate[session.data_completa];

            if (data.trainer.nome_completo) dayData.docenti.add(data.trainer.nome_completo);

            const parts = this.splitSessionByLunch(session);

            parts.forEach(p => {
                const duration = this.calculateDurationSimple(p.ora_inizio, p.ora_fine);
                const startH = parseInt(p.ora_inizio.split(':')[0]);
                const range = `${p.ora_inizio}-${p.ora_fine}`;

                dayData.hours += duration;

                if (startH < 13) {
                    dayData.morning.push(range);
                } else {
                    dayData.afternoon.push(range);
                }
            });
        }

        Object.entries(sessionsByDate).forEach(([dateStr, info]) => {
            sessionRows.push(new TableRow({
                children: [
                    this.createTableCell(dateStr),
                    this.createTableCell(info.morning.join("\n")),
                    this.createTableCell(info.afternoon.join("\n")),
                    this.createTableCell(info.hours.toString()),
                    this.createTableCell(Array.from(info.docenti).join(", ") || "Docente"),
                ]
            }));
        });

        // Header
        const header = new Header({
            children: [
                headerImageBuffer ? new Paragraph({
                    children: [
                        new ImageRun({
                            data: headerImageBuffer,
                            transformation: { width: 600, height: 60 },
                            type: "png"
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }) : new Paragraph({ text: "", alignment: AlignmentType.CENTER }),
            ],
        });

        const sectionProps = {
            properties: {
                page: {
                    margin: {
                        top: "1.0cm",
                        bottom: "1.0cm",
                        left: "1.5cm",
                        right: "1.5cm"
                    }
                }
            },
            headers: { default: header },
        };

        const doc = new Document({
            sections: [{
                ...sectionProps,
                children: [
                    // --- PAGE 1: Title and Info ---
                    new Paragraph({
                        children: [new TextRun({ text: "Raccomandata a mano (convocazione formale)", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        alignment: AlignmentType.LEFT,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "CONVOCAZIONE DEL BENEFICIARIO PER L’EROGAZIONE DEI SERVIZI PER IL LAVORO E INFORMATIVA SULLE SANZIONI (NASPI, DIS-COLL, RDC)",
                                bold: true,
                                font: FONT_FAMILY,
                                size: 22
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 300 }
                    }),

                    new Paragraph({
                        children: [new TextRun({ text: "Gentile", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "Nome: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: `${partecipante.nome}  `, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: "Cognome: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: `${partecipante.cognome}  `, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: "Codice Fiscale: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: `${partecipante.codiceFiscale}`, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                        ],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "in qualità di beneficiaria/o di prestazioni INPS a sostegno del reddito, La invitiamo a presentarsi/partecipare al percorso formativo. Il corso sarà erogato nel rispetto delle date e degli orari così come specificati nel calendario, parte integrante di questa informativa che si sottoscrive per presa visione e accettazione.",
                                font: FONT_FAMILY,
                                size: FONT_SIZE_BODY
                            })
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Qualora non potesse presentarsi/partecipare ad una delle giornate di lezione, così come calendarizzate, per comprovati impedimenti oggettivi",
                                font: FONT_FAMILY,
                                size: FONT_SIZE_BODY
                            }),
                            new TextRun({ text: "1", font: FONT_FAMILY, size: 14, superScript: true }),
                            new TextRun({
                                text: " dovrà darne comunicazione, allegando idonea documentazione, entro la data prevista per la lezione interessata dall’assenza, e comunque non oltre il giorno successivo alla stessa, al seguente indirizzo mail:",
                                font: FONT_FAMILY,
                                size: FONT_SIZE_BODY
                            })
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: supervisorEmail, bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY, color: "000000" })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "In caso di mancata presentazione/partecipazione ad una giornata di lezione senza giustificato motivo è prevista l’applicazione di specifiche sanzioni (regime di condizionalità per i percettori Naspi/Dis-coll",
                                font: FONT_FAMILY,
                                size: FONT_SIZE_BODY
                            }),
                            new TextRun({ text: "2", font: FONT_FAMILY, size: 14, superScript: true }),
                            new TextRun({ text: " e per i percettori RDC", font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: "3", font: FONT_FAMILY, size: 14, superScript: true }),
                            new TextRun({
                                text: "). Più precisamente, ai fini dell’irrogazione delle sanzioni previste, l’ipotesi della “mancata partecipazione” sarà integrata nei casi di assenza non giustificata per almeno due giornate in ciascun mese di attività (Circolare ANPAL n. 1 del 05/08/2022).",
                                font: FONT_FAMILY,
                                size: FONT_SIZE_BODY
                            })
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Nel caso di richieste di chiarimento e/o precisazioni con riferimento al giustificativo motivo si prega di contattare il CPI di competenza territoriale cui compete altresì la valutazione circa l’ammissibilità della documentazione quale giustificativo dell’assenza e l’eventuale conseguente applicazione della condizionalità.",
                                font: FONT_FAMILY,
                                size: FONT_SIZE_BODY
                            })
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 400 }
                    }),

                    // Signatures 1
                    new Paragraph({
                        children: [new TextRun({ text: `${luogo}, ${dataInizio}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 200 }
                    }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "Ente Formativo\n(Nome Cognome)", font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                        ],
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "Persona beneficiaria", font: FONT_FAMILY, size: FONT_SIZE_BODY })] }),
                                            new Paragraph({ children: [new TextRun({ text: `${partecipante.nome} ${partecipante.cognome}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                        ],
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" })],
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: "(Firma per ricevuta)", font: FONT_FAMILY, size: FONT_SIZE_SMALL })], alignment: AlignmentType.CENTER })],
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    })
                                ]
                            })
                        ],
                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                    }),

                    // Footnotes
                    new Paragraph({ text: "", spacing: { after: 200 } }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "1 ", superScript: true, font: FONT_FAMILY, size: 16 }),
                            new TextRun({
                                text: "Con Nota prot. 39/0003374 del 4 marzo 2016, il Ministero del Lavoro e delle Politiche Sociali ha individuato le seguenti ipotesi di giustificato motivo: “a) documentato stato di malattia o di infortunio; b) servizio civile o servizio di leva o richiamo alle armi; c) stato di gravidanza, per i periodi di astensione previsti dalla legge; d) citazioni in tribunale, a qualsiasi titolo, dietro esibizione dell’ordine di comparire da parte del magistrato; e) gravi motivi familiari documentati e/o certificati; f) casi di limitazione legale della mobilità personale; g) ogni comprovato impedimento oggettivo e/o cause di forza maggiore, cioè ogni fatto o circostanza che impedisca al soggetto di presentarsi presso gli uffici, senza possibilità di alcuna valutazione di carattere soggettivo o discrezionale da parte di quest’ultimo”.",
                                font: FONT_FAMILY,
                                size: 16
                            }),
                        ],
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "2 ", superScript: true, font: FONT_FAMILY, size: 16 }),
                            new TextRun({
                                text: "Per la CONDIZIONALITA’ NASPI E DIS-COLL, le sanzioni applicabili previste dal D. Lgs. 150/2015, art. 21 comma 7 così come richiamate dalla Circolare ANPAL n. 1 del 5/08/2022 prevedono: in caso di mancata presentazione, in assenza di giustificato motivo, per almeno due giornate in ciascun mese di attività, a iniziative di carattere formativo o di riqualificazione o altra iniziativa di politica attiva o di attivazione e mancata presentazione/partecipazione allo svolgimento di attività a fini di pubblica utilità a beneficio della comunità territoriale di appartenenza: 1) la decurtazione di una mensilità, alla prima mancata partecipazione; 2) la decadenza dalla prestazione e dallo stato di disoccupazione, in caso di ulteriore mancata presentazione.",
                                font: FONT_FAMILY,
                                size: 16
                            }),
                        ],
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "3 ", superScript: true, font: FONT_FAMILY, size: 16 }),
                            new TextRun({
                                text: "Per la CONDIZIONALITA’ RDC le sanzioni applicabili previste dall’art. 7, co. 5, lett. c), del D.L. 2/2019 cosi come richiamate dalla Circolare ANPAL n. 1 del 5/08/2022 prevedono: la decadenza dal RDC quando uno dei componenti il nucleo familiare non partecipa, in assenza di giustificato motivo, alle iniziative di carattere formativo o di riqualificazione o ad altra iniziativa di politica attiva o di attivazione, di cui all’art. 20, comma 3, lett. b) del d.lgs. 150/15. Si precisa che anche tale sanzione verrà irrogata nei casi di mancata presentazione, in assenza di giustificato motivo, per almeno due giornate in ciascun mese di attività.",
                                font: FONT_FAMILY,
                                size: 16
                            }),
                        ],
                        spacing: { after: 100 }
                    }),

                    // --- PAGE 2 ---
                    new Paragraph({
                        text: "",
                        pageBreakBefore: true
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "SERVIZI ALLA FORMAZIONE ATTIVATI NELLA DOTE GOL, a favore di:", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "Nome: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: `${partecipante.nome}  `, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: "Cognome: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: `${partecipante.cognome}  `, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: "Codice Fiscale: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: `${partecipante.codiceFiscale}`, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                        ],
                        spacing: { after: 300 }
                    }),

                    new Paragraph({
                        children: [new TextRun({ text: "AVVISO:", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: "TITOLO PERCORSO: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: data.corso.titolo, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "id. corso: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: `${data.corso.id}    `, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: "id. sezione: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: idSezione, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "DENOMINAZIONE SOGGETTO EROGATORE: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: data.ente.nome, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "ID SOGGETTO EROGATORE: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: "2479052", font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ]
                    }),
                    new Paragraph({ text: "" }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "SEDE DI SVOLGIMENTO DEL CORSO: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                            new TextRun({ text: sedeIndirizzo, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `PERIODO: dal ${dataInizio} al ${dataFine}`, bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                        ],
                        spacing: { after: 200 }
                    }),

                    // Calendar
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    this.createTableHeaderCell("Data"),
                                    this.createTableHeaderCell("Mattina"),
                                    this.createTableHeaderCell("Pomeriggio"),
                                    this.createTableHeaderCell("Tot. ore"),
                                    this.createTableHeaderCell("Docente"),
                                ]
                            }),
                            ...sessionRows
                        ],
                        borders: this.getSimpleBorders()
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({ text: `TOTALE ORE: ${data.corso.ore_totali}`, bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        spacing: { before: 200, after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "LE DATE POTRANNO SUBIRE VARIAZIONI IN FUNZIONE DELL’ORGANIZZAZIONE DELL’ENTE", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        spacing: { after: 300 }
                    }),

                    // Final Signatures
                    new Paragraph({
                        children: [new TextRun({ text: `${luogo}, ${dataInizio}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 200 }
                    }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "Ente Formativo", font: FONT_FAMILY, size: FONT_SIZE_BODY })] }),
                                            new Paragraph({ children: [new TextRun({ text: data.ente.nome, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                        ],
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "Persona beneficiaria", font: FONT_FAMILY, size: FONT_SIZE_BODY })] }),
                                            new Paragraph({ children: [new TextRun({ text: `${partecipante.cognome} ${partecipante.nome}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                        ],
                                        width: { size: 50, type: WidthType.PERCENTAGE },
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" })],
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: "(Firma per ricevuta)", font: FONT_FAMILY, size: FONT_SIZE_SMALL })], alignment: AlignmentType.CENTER })],
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    })
                                ]
                            })
                        ],
                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                    }),
                ]
            }]
        });

        return await Packer.toBlob(doc);
    }

    private calculateDurationSimple(start: string, end: string): number {
        if (!start || !end) return 0;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        return diff > 0 ? diff / 60 : 0;
    }

    // --- COMPONENT HELPERS ---

    // New function for nested data table in Section 1
    private createDataSectionTable(data: CourseData, idLine: string): Table {
        const rows = [
            this.createDataRow("Denominazione ente accreditato:", data.ente.nome),
            this.createDataRow("Sede Accreditata di riferimento......", data.ente.accreditato ? `${data.ente.accreditato.via}, ${data.ente.accreditato.comune}` : data.ente.indirizzo),
            this.createDataRow("Piattaforma utilizzata:", data.fad_settings.piattaforma || "Zoom"),
            this.createDataRow("Titolo del corso:", data.corso.titolo),
            this.createDataRow("ID Corso/Progetto:", idLine),
            this.createDataRow("Numero di ore in FAD...", data.fad_settings.obiettivi_didattici && !isNaN(Number(data.fad_settings.obiettivi_didattici)) ? data.fad_settings.obiettivi_didattici : data.moduli.reduce((acc, m) => acc + m.sessioni.filter(s => s.is_fad).reduce((sAcc, s) => sAcc + this.calculateDurationSimple(s.ora_inizio, s.ora_fine), 0), 0).toString(), true), // Yellow
            this.createDataRow("Offerta Formativa in Gefo o SIUF......", `${data.corso.offerta_formativa.codice} ${data.corso.offerta_formativa.nome}`, true), // Yellow
            this.createDataRow("Referente delle attività", data.trainer.nome_completo),
            this.createDataRow("E-mail e n. telefono:", `${data.trainer.telefono || '.............'} ${data.trainer.email || ''}`),
            this.createDataRow("Utenza Guest per permettere Il controllo di Regione Lombardia:", data.fad_settings.zoom_link || "....................................", true), // Yellow
            this.createDataRow("ID riunione:", data.fad_settings.zoom_meeting_id || "......................."),
            this.createDataRow("Passcode:", data.fad_settings.zoom_passcode || "......................."),
        ];

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows,
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
            }
        });
    }

    private createDataRow(label: string, value: string, highlight: boolean = false): TableRow {
        return new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: label + "  ", font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                                new TextRun({ text: value || "", font: FONT_FAMILY, size: FONT_SIZE_BODY }), // No "____" default here as requested by 'values ... format'
                            ]
                        })
                    ],
                    shading: highlight ? { fill: YELLOW_HIGHLIGHT_COLOR } : undefined,
                })
            ]
        });
    }

    private createContentBox(content: string, isBig: boolean = false): Table {
        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: content, font: FONT_FAMILY, size: FONT_SIZE_BODY })]
                                })
                            ],
                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                            // Min height if big ?
                        })
                    ]
                })
            ],
            borders: this.getSimpleBorders(),
        });
    }

    private getTopicsString(data: CourseData): string {
        const allArgs: string[] = [];
        data.moduli.forEach(m => {
            m.argomenti.forEach(a => allArgs.push(a));
        });
        return allArgs.length > 0 ? allArgs.join("; ") : "[Spazio di testo libero]";
    }

    private createFadSessionsTable(data: CourseData): Table {
        // Headers with styling
        const headers = ["DATA", "ORA INIZIO", "ORA FINE", "MATERIA", "DOCENTE", "NOTE"];
        const headerRow = new TableRow({
            children: headers.map(h => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
                shading: { fill: GRAY_BANNER_COLOR },
                verticalAlign: AlignmentType.CENTER,
                borders: this.getSimpleBorders()
            }))
        });

        // Flatten FAD sessions
        const sessionRows = data.moduli.flatMap(modulo =>
            modulo.sessioni
                .filter(s => s.is_fad)
                .flatMap((session) => {
                    // Split session if needed
                    const parts = this.splitSessionByLunch(session);
                    return parts.map(part => {
                        return new TableRow({
                            children: [
                                this.createTableCell(session.data_completa),
                                this.createTableCell(part.ora_inizio),
                                this.createTableCell(part.ora_fine),
                                this.createTableCell(data.corso.titolo), // Was session.argomento
                                this.createTableCell(data.trainer.nome_completo || ''),
                                this.createTableCell(""),
                            ]
                        });
                    });
                })
        );

        // Add empty rows if needed (e.g. at least 5)
        if (sessionRows.length < 5) {
            for (let i = sessionRows.length; i < 5; i++) {
                sessionRows.push(new TableRow({
                    children: [
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell(""),
                    ]
                }));
            }
        }

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...sessionRows],
            borders: this.getSimpleBorders(),
        });
    }

    private createParticipantsTable(data: CourseData): Table {
        // Headers: N., NOMINATIVO, E-MAIL
        // Widths: N (narrow), NOMINATIVO (wide), E-MAIL (medium)
        // Let's approximate percentages: 10%, 60%, 30%

        const headerRow = new TableRow({
            children: [
                this.createHeaderCellWithWidth("N.", 10),
                this.createHeaderCellWithWidth("NOMINATIVO", 60),
                this.createHeaderCellWithWidth("E-MAIL", 30),
            ]
        });

        const participantRows = data.partecipanti.map((p, index) => new TableRow({
            children: [
                this.createTableCellWithWidth((index + 1).toString(), 10),
                this.createTableCellWithWidth(`${p.cognome} ${p.nome}`, 60),
                this.createTableCellWithWidth(p.email || "", 30),
            ]
        }));

        // Fill up to 10 rows
        const targetRows = 10;
        if (participantRows.length < targetRows) {
            for (let i = participantRows.length; i < targetRows; i++) {
                participantRows.push(new TableRow({
                    children: [
                        this.createTableCellWithWidth((i + 1).toString(), 10),
                        this.createTableCellWithWidth("", 60),
                        this.createTableCellWithWidth("", 30),
                    ]
                }));
            }
        }

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...participantRows],
            borders: this.getSimpleBorders(),
        });
    }

    private createHeaderCellWithWidth(text: string, widthPercent: number): TableCell {
        return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
            shading: { fill: GRAY_BANNER_COLOR },
            verticalAlign: AlignmentType.CENTER,
            width: { size: widthPercent, type: WidthType.PERCENTAGE },
            borders: this.getSimpleBorders()
        });
    }

    private createTableCellWithWidth(text: string, widthPercent: number): TableCell {
        return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })],
            verticalAlign: AlignmentType.CENTER,
            width: { size: widthPercent, type: WidthType.PERCENTAGE },
            borders: this.getSimpleBorders()
        });
    }

    private createTableHeaderCell(text: string): TableCell {
        return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })], alignment: AlignmentType.CENTER })],
            shading: { fill: GRAY_BANNER_COLOR },
            verticalAlign: AlignmentType.CENTER,
            borders: this.getSimpleBorders()
        });
    }

    private createTableCell(text: string): TableCell {
        return new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })],
            verticalAlign: AlignmentType.CENTER,
            borders: this.getSimpleBorders()
        });
    }

    private getSimpleBorders() {
        return {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
        };
    }

    private getThickBorders() {
        return {
            top: { style: BorderStyle.SINGLE, size: 12 }, // Thick
            bottom: { style: BorderStyle.SINGLE, size: 12 },
            left: { style: BorderStyle.SINGLE, size: 12 },
            right: { style: BorderStyle.SINGLE, size: 12 },
        };
    }

    // --- MODELLO B HELPERS ---

    private createModelloBTable(data: CourseData, session: Sessione, splitSessions: Sessione[]): Table {
        // 1. Date Header Row (Gray Background)
        const dateRow = new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: `GIORNO: ${session.giorno}   MESE: ${session.mese}   ANNO: ${session.anno}`, bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                            ],
                            alignment: AlignmentType.LEFT
                        })
                    ],
                    columnSpan: 6, // Span across all 6 columns
                    shading: { fill: GRAY_BANNER_COLOR },
                    borders: this.getSimpleBorders()
                })
            ]
        });

        // 2. Main Headers
        // "Partecipante", "Ora di connessione", "Ora di disconnessione", "Orario della lezione online", "Argomento", "Firma"
        // Colonna "Orario della lezione online" is special: it has content underneath? 
        // No, header is "Orario della lezione online" and inside we put "START - END".
        // BUT schema says: "Intestazioni (Due Livelli)... La colonna Orario... è divisa internamente".
        // Simpler implementation: Single row header, and in the data cells we put the range.

        const headers = ["Partecipante", "Ora di connessione", "Ora di disconnessione", "Orario della lezione online", "Argomento della lezione online", "Firma del docente"];
        // Some headers text might change:
        // "Orario della lezione online" -> cell below will have "{ORA_INIZIO} - {ORA_FINE}"

        const headerRow = new TableRow({
            children: headers.map(text => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: FONT_FAMILY, size: 18 })], alignment: AlignmentType.CENTER })], // Smaller font for headers as requested "headers... più piccole"? No, "intestazioni delle ore... sono più piccole delle colonne che descrivono". Let's use 9pt (18)
                verticalAlign: AlignmentType.CENTER,
                borders: this.getSimpleBorders(),
                width: { size: 100 / 6, type: WidthType.PERCENTAGE }
            }))
        });

        // 3. Data Rows
        // 3. Data Rows
        // For each participant, we create multiple rows if splitSessions > 1
        const rows = data.partecipanti.map(p => {
            // Join session parts
            // Connection: 09:00 / 14:00
            // Disconnection: 13:00 / 17:00
            // Range: 09:00 - 13:00 / 14:00 - 17:00

            const connectionTime = splitSessions.map(part => part.ora_inizio).join(' / ');
            const disconnectionTime = splitSessions.map(part => part.ora_fine).join(' / ');
            const scheduleRange = splitSessions.map(part => `${part.ora_inizio} - ${part.ora_fine}`).join(' / ');

            // Use splitSessions[0].argomento usually, or join if different? Assuming same argument.
            const argument = splitSessions[0]?.argomento || session.argomento || "";

            return new TableRow({
                children: [
                    this.createTableCell(`${p.cognome} ${p.nome}`),
                    this.createTableCell(connectionTime),
                    this.createTableCell(disconnectionTime),
                    this.createTableCell(scheduleRange),
                    this.createTableCell(argument),
                    this.createTableCell(data.trainer.nome_completo || "")
                ]
            });
        });

        // Add empty rows to fill page if needed?
        if (rows.length < 10) {
            for (let i = rows.length; i < 10; i++) {
                rows.push(new TableRow({
                    children: [
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell(""),
                        this.createTableCell("")
                    ]
                }));
            }
        }

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [dateRow, headerRow, ...rows],
            borders: this.getSimpleBorders()
        });
    }

    private createSignatureSection(data: CourseData, signatureImageBuffer: ArrayBuffer | null = null): Table {
        // We need a layout for the signature:
        // Left: Director Name
        // Center/Right: "FIRMA" label, Role Label, Dotted Line

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        // Left cell: Director Name
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: data.direttore?.nome_completo || "", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                                    alignment: AlignmentType.LEFT
                                })
                            ],
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            width: { size: 50, type: WidthType.PERCENTAGE }
                        }),
                        // Right cell: Signature block
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "FIRMA", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                                    alignment: AlignmentType.CENTER
                                }),
                                new Paragraph({ text: "", spacing: { after: 200 } }), // Space for signature
                                new Paragraph({
                                    children: [new TextRun({ text: "....................................................", font: FONT_FAMILY, size: FONT_SIZE_BODY })], // Dotted line
                                    alignment: AlignmentType.CENTER
                                }),
                                signatureImageBuffer ? new Paragraph({
                                    children: [
                                        new ImageRun({
                                            data: signatureImageBuffer,
                                            transformation: { width: 150, height: 50 },
                                            type: "png"
                                        })
                                    ],
                                    alignment: AlignmentType.CENTER
                                }) : new Paragraph({ text: "", spacing: { after: 10 } }),
                                new Paragraph({
                                    children: [new TextRun({ text: "IL DIRETTORE DEL CORSO (2)", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                                    alignment: AlignmentType.CENTER
                                }),
                            ],
                            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                            width: { size: 50, type: WidthType.PERCENTAGE }
                        })
                    ]
                })
            ],
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } }
        });
    }

    // --- VERBALE FINE CORSO GENERATION ---
    public async generateVerbaleFineCorso(data: CourseData, moduleIndex: number = 0): Promise<Blob> {
        // 1. Fetch Assets
        let headerImageBuffer: ArrayBuffer | null = null;
        let logoAkgBuffer: ArrayBuffer | null = null;
        let firmaRespBuffer: ArrayBuffer | null = null;
        let stampBuffer: ArrayBuffer | null = null;

        try {
            headerImageBuffer = await this.fetchImage('/Templates_standard/86e2d75c-adbe-4e9d-8afa-25b423f5e444.png');
            logoAkgBuffer = await this.fetchImage('/Templates_standard/Verbali/Finale/Logo_AKG.png');
            firmaRespBuffer = await this.fetchImage('/Templates_standard/Verbali/Finale/Firma_RESP.png');

            // Stamp Logic
            const address = (data.ente.accreditato?.via || data.ente.indirizzo || "").toLowerCase();
            let stampFile = "";
            if (address.includes("venezia")) {
                stampFile = "Porta_Venezia.jpg";
            } else if (address.includes("decembrio") || address.includes("corvetto")) {
                stampFile = "Decembrio.jpg";
            }

            if (stampFile) {
                stampBuffer = await this.fetchImage(`/Templates_standard/Timbri/${stampFile}`);
            }

        } catch (e) {
            console.error("Error loading assets for Verbale", e);
        }

        const modulo = data.moduli[moduleIndex] || data.moduli[0];
        // Parse Responsible Name
        const respNameFull = data.responsabile_certificazione.nome_completo || data.direttore?.nome_completo || "";
        const nameParts = respNameFull.split(" ");
        const respCognome = nameParts.pop() || "";
        const respNome = nameParts.join(" ");

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { // Fixed: margins -> margin
                            top: 1417, // 2.5cm
                            bottom: 1133, // 2.0cm
                            left: 1133, // 2.0cm
                            right: 1133, // 2.0cm
                        }
                    }
                },

                headers: {
                    default: new Header({
                        children: [
                            headerImageBuffer ? new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: headerImageBuffer,
                                        transformation: { width: 600, height: 60 },
                                        type: "png"
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 300 } // 15pt approx
                            }) : new Paragraph({ text: "[HEADER]", alignment: AlignmentType.CENTER }),
                        ],
                    }),
                },
                footers: {
                    default: this.createVerbaleFooter(data, logoAkgBuffer),
                },
                children: [
                    // --- TITLE ---
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Verbale per il rilascio dell’attestato di partecipazione",
                                font: "Calibri",
                                size: 28, // 14pt
                                color: GREEN_TITLE_COLOR,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 0 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "con il riconoscimento di abilità e conoscenze",
                                font: "Calibri",
                                size: 28, // 14pt
                                color: GREEN_TITLE_COLOR,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 0 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Garanzia Occupabilità Lavoratori",
                                font: "Times New Roman",
                                bold: true,
                                size: 24, // 12pt
                                color: "000000"
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100, after: 400 }
                    }),

                    // --- BODY ---
                    // "SOGGETTO EROGATORE: ..."
                    new Paragraph({
                        children: [
                            new TextRun({ text: "SOGGETTO EROGATORE: ", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                            new TextRun({ text: (data.ente.nome || "AK GROUP s.r.l.").toUpperCase(), size: FONT_SIZE_BODY, font: FONT_FAMILY })
                        ],
                        spacing: { after: 200 }
                    }),

                    // "1. Percorso / azione formativa:"
                    new Paragraph({
                        children: [
                            new TextRun({ text: "1. Percorso / azione formativa:", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "CORSO DI FORMAZIONE: ", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                            new TextRun({ text: data.corso.titolo + "\t\t\t\t", size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                            new TextRun({ text: `id corso: ${data.corso.id}\t\tid sez. ${modulo.id_sezione || 'N/D'}`, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        tabStops: [
                            { type: "left", position: 5000 }, // Approx mid-page
                            { type: "left", position: 8000 }
                        ],
                        spacing: { after: 200 }
                    }),

                    // "2. Responsabile della Certificazione..."
                    new Paragraph({
                        children: [
                            new TextRun({ text: "2. Responsabile della Certificazione delle competenze", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { after: 100 }
                    }),
                    this.createKeyValue("Nome:", respNome || "Gianfranco"),
                    this.createKeyValue("Cognome:", respCognome || "Torre"),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Nato il ${data.responsabile_certificazione.data_nascita || "14/07/1987"} a ${data.responsabile_certificazione.luogo_nascita || "Palermo, Provincia di Palermo"}`, size: FONT_SIZE_BODY, font: FONT_FAMILY })
                        ],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Residente a ${data.responsabile_certificazione.residenza || "Reggio Calabria in VIALE A. MORO TR. SCORDINO n° 25"}`, size: FONT_SIZE_BODY, font: FONT_FAMILY })
                        ],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Doc. identità: ${data.responsabile_certificazione.documento || "AX 2491909"}`, size: FONT_SIZE_BODY, font: FONT_FAMILY })
                        ],
                        spacing: { after: 200 }
                    }),


                    // "3. Risorse coinvolte"
                    new Paragraph({
                        children: [
                            new TextRun({ text: "3. Risorse coinvolte", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { after: 100 }
                    }),
                    // Trainer
                    new Paragraph({ children: [new TextRun({ text: "- Qualifica: Trainer del corso", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: "Fase: Definizione criteri e/o prove di accertamento, accertamento, valutazione conclusiva, compilazione e/o rilascio dell’Attestato", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: `- Cognome e Nome: ${data.trainer.nome_completo}`, bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 150 } }),

                    // Supervisor
                    new Paragraph({ children: [new TextRun({ text: "Qualifica: Supervisore", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: "Fase: definizione criteri e/o prove di accertamento, accertamento, valutazione conclusiva, compilazione e/o rilascio dell’Attestato", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: `- Cognome e Nome: ${data.supervisore?.nome_completo || data.tutor?.nome_completo || "...................."}`, bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 200 } }),


                    // "4. Candidati"
                    new Paragraph({
                        children: [
                            new TextRun({ text: "4. Candidati", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { after: 100 }
                    }),
                    // List of candidates
                    ...data.partecipanti.map(p => new Paragraph({
                        children: [
                            new TextRun({ text: `${p.nome} ${p.cognome}`, size: FONT_SIZE_BODY, font: FONT_FAMILY })
                        ],
                        spacing: { after: 50 }
                    })),

                    new Paragraph({ text: "", spacing: { after: 200 } }),

                    // "5. Processo"
                    new Paragraph({
                        children: [
                            new TextRun({ text: "5. Processo", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { after: 100 }
                    }),

                    // 5.1 Accertamento
                    new Paragraph({ children: [new TextRun({ text: "5.1. Accertamento", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 100 } }),

                    // 5.1.1. forme
                    new Paragraph({ children: [new TextRun({ text: "5.1.1. Forme", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 720 }, spacing: { after: 50 } }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "☒ solo prove", font: "MS Gothic", size: FONT_SIZE_BODY }), // Using MS Gothic for checkbox approximation if Wingdings fails
                        ],
                        indent: { left: 1080 },
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "☐ prove ed analisi documentale", font: "MS Gothic", size: FONT_SIZE_BODY }),
                        ],
                        indent: { left: 1080 },
                        spacing: { after: 100 }
                    }),

                    // 5.1.2. Prove
                    new Paragraph({ children: [new TextRun({ text: "5.1.2. Prove", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 720 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: "N.1 prova scritta con valutazione dei temi trattati durante il corso di formazione preparata ad hoc seguendo la metodologia adottata nel corso.", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 1080 }, spacing: { after: 100 } }),

                    // 5.1.3. Criteri...
                    new Paragraph({ children: [new TextRun({ text: "5.1.3. Criteri, indicatori e pesi", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 720 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: "Criteri di valutazione: il partecipante deve dimostrare di sapere affrontare e superare almeno il 50% delle richieste della prova.\nGli indicatori sono correttezza lessicale e nelle risposte.\nEssendo la prova unica, il 100% del peso della valutazione è misurato su di essa.", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 1080 }, spacing: { after: 100 } }),

                    // 5.1.4. Modalità
                    new Paragraph({ children: [new TextRun({ text: "5.1.4. Modalità", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 720 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: "La prova è stata svolta in classe sotto la supervisione del trainer del corso in un’ora.", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 1080 }, spacing: { after: 100 } }),


                    // 5.2. Valutazione
                    new Paragraph({ children: [new TextRun({ text: "5.2. Valutazione", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 100 } }),

                    // 5.2.1. Modalità
                    new Paragraph({ children: [new TextRun({ text: "5.2.1. Modalità", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 720 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: "La valutazione è stata assegnata come positiva in caso di superamento del 60% di risposte esatte. La valutazione tiene conto dei miglioramenti dello studente durante il corso.", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 1080 }, spacing: { after: 100 } }),

                    // 5.2.2. Esiti
                    new Paragraph({ children: [new TextRun({ text: "5.2.2. Esiti", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 720 }, spacing: { after: 50 } }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "a) Positivi: ", size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                            new TextRun({
                                text: data.partecipanti.map(p => `${p.nome} ${p.cognome}`).join(", "),
                                size: FONT_SIZE_BODY,
                                font: FONT_FAMILY
                            }),
                        ],
                        indent: { left: 1080 },
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "b) Negativi: ", size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        indent: { left: 1080 },
                        spacing: { after: 100 }
                    }),

                    // 5.3 Certificazione
                    new Paragraph({ children: [new TextRun({ text: "5.3. Certificazione", bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 360 }, spacing: { after: 50 } }),
                    new Paragraph({ children: [new TextRun({ text: "L’attestato è stato protocollato sulla piattaforma SIUF.", size: FONT_SIZE_BODY, font: FONT_FAMILY })], indent: { left: 720 }, spacing: { after: 300 } }),


                    // --- SIGNATURES ---
                    // "Luogo e data: ..."
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Luogo e data: ${data.ente.accreditato?.comune || "Milano"}, ${modulo.data_fine || new Date().toLocaleDateString('it-IT')}`, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { after: 400 }
                    }),

                    // Signature Block
                    // "Firma (Responsabile della certificazione delle competenze)"
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Firma (Responsabile della certificazione delle competenze)", size: FONT_SIZE_BODY, font: FONT_FAMILY }),
                        ],
                        spacing: { after: 100 } // Space for img
                    }),

                    // Image + Stamp
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            firmaRespBuffer ? new Paragraph({
                                                children: [
                                                    new ImageRun({
                                                        data: firmaRespBuffer,
                                                        transformation: { width: 150, height: 60 },
                                                        type: "png"
                                                    })
                                                ]
                                            }) : new Paragraph({ children: [new TextRun({ text: "[Firma Mancante]", size: FONT_SIZE_BODY })] }),
                                        ],
                                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [new TextRun({ text: "Timbro Soggetto erogatore", size: FONT_SIZE_BODY, font: FONT_FAMILY })],
                                                alignment: AlignmentType.CENTER
                                            }),
                                            stampBuffer ? new Paragraph({
                                                children: [
                                                    new ImageRun({
                                                        data: stampBuffer,
                                                        transformation: { width: 150, height: 150 },
                                                        type: "jpg"
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER
                                            }) : new Paragraph({ text: "[Timbro Mancante]", alignment: AlignmentType.CENTER }),
                                        ],
                                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                                    })
                                ],
                            })
                        ],
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } }
                    })

                ]
            }]
        });

        return await Packer.toBlob(doc);
    }

    private createKeyValue(key: string, value: string, subLabel: string = "", indent: number = 0): Paragraph {
        const children = [
            new TextRun({ text: key + " ", size: FONT_SIZE_BODY, font: FONT_FAMILY }),
            new TextRun({ text: value, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
        ];
        if (subLabel) {
            children.push(new TextRun({ text: " " + subLabel, size: FONT_SIZE_BODY, font: FONT_FAMILY }));
        }
        return new Paragraph({
            children: children,
            indent: { left: indent },
            spacing: { after: 50 }
        });
    }

    private createVerbaleFooter(data: CourseData, logoAkg: ArrayBuffer | null): Footer {
        // Footer requests:
        const footerText = "AK Group S.r.l. Sede legale/operativa in Corso di Porta Romana 122, 20122 Milano (MI) +39 02 5002 0902 | www.akgitalia.it | p. IVA 10906000962 | PEC akgpal.lombardia@pec.it Sede operativa in Via Walter Marcobi 4, 21100 Varese (VA) | +39 0332 1880 313";

        return new Footer({
            children: [
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                // Left Text
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: footerText,
                                                    size: 14, // 7pt
                                                    font: "IBM Plex Sans ExtraLight", // User requested
                                                    color: "000000"
                                                })
                                            ],
                                            alignment: AlignmentType.LEFT
                                        }),
                                    ],
                                    width: { size: 85, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.BOTTOM
                                }),
                                // Right Logo
                                new TableCell({
                                    children: [
                                        logoAkg ? new Paragraph({
                                            children: [
                                                new ImageRun({
                                                    data: logoAkg,
                                                    transformation: { width: 60, height: 60 },
                                                    type: "png"
                                                })
                                            ],
                                            alignment: AlignmentType.RIGHT
                                        }) : new Paragraph({ text: "", alignment: AlignmentType.RIGHT })
                                    ],
                                    width: { size: 15, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.BOTTOM
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    }

    private createFooter(): Footer {
        return new Footer({
            children: [
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                        new TextRun({
                            children: ["Pagina ", PageNumber.CURRENT, " di ", PageNumber.TOTAL_PAGES],
                            font: FONT_FAMILY,
                            size: FONT_SIZE_SMALL,
                        }),
                    ],
                }),
            ],
        });
    }

    // --- MODULO 7 GENERATION (COMUNICAZIONE EVENTO) ---
    public async generateModulo7(data: CourseData, sessione: Sessione, partecipante: Partecipante): Promise<Blob> {
        // Load Header Image
        let headerImageBuffer: ArrayBuffer | null = null;
        try {
            // User specified: @[public/Header/Lavor_in_Lombardia.jpg]
            headerImageBuffer = await this.fetchImage('/Header/Lavor_in_Lombardia.jpg');
        } catch (e) {
            console.warn("Modulo 7 Header Image not found at /Header/Lavor_in_Lombardia.jpg");
            try {
                // Fallback to png usually used
                headerImageBuffer = await this.fetchImage('/Header/logo_lavoro_lombardia.png');
            } catch (e2) {
                // Ignore
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: "2.5cm",
                            bottom: "2.0cm",
                            left: "2.0cm",
                            right: "2.0cm"
                        }
                    }
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "All. 7", color: "808080", size: FONT_SIZE_SMALL, font: FONT_FAMILY })
                                ],
                                alignment: AlignmentType.LEFT
                            }),
                            headerImageBuffer ? new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: headerImageBuffer,
                                        transformation: { width: 188, height: 60 },
                                        type: "jpg"
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }) : new Paragraph({ text: "[LOGO LAVORO IN LOMBARDIA]", alignment: AlignmentType.CENTER }),
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "2 È prevista la firma elettronica avanzata o qualificata/digitale o autografa corredata da un documento di identità del soggetto firmatario",
                                        size: 16, // 8pt
                                        font: FONT_FAMILY
                                    })
                                ],
                            })
                        ]
                    })
                },
                children: [
                    // --- MITTENTE ---
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Mittente: ${data.ente.nome}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Al Centro per l’Impiego (CPI titolare della SAP)", font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 400 }
                    }),

                    // --- OGGETTO ---
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Oggetto: Comunicazione al CPI di competenza della mancata presentazione/partecipazione dell’utente percettore di sostegno al reddito all’appuntamento fissato dall’Operatore accreditato (ex Circolare ANPAL n.1/2022) 1",
                                bold: true,
                                font: FONT_FAMILY,
                                size: FONT_SIZE_BODY
                            })
                        ],
                        spacing: { after: 200 }
                    }),

                    // --- BODY ---
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Con la presente si comunica che l’utente:", font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        spacing: { after: 100 }
                    }),

                    this.createNoBorderRow("Nome:", partecipante.nome),
                    this.createNoBorderRow("Cognome:", partecipante.cognome),
                    this.createNoBorderRow("Codice Fiscale:", partecipante.codiceFiscale),

                    new Paragraph({ text: "", spacing: { after: 100 } }),

                    new Paragraph({
                        children: [new TextRun({ text: "che partecipa alle attività del programma di politiche attive del lavoro in qualità di beneficiario di:", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({ children: [new TextRun({ text: "NASPI o DIS-COLL", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: "Reddito di Cittadinanza", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 }, spacing: { after: 100 } }),

                    new Paragraph({
                        children: [new TextRun({ text: "È stato convocato/a con modalità:", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({ children: [new TextRun({ text: "informale (specificare modalità e data di contatto)", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: "formale (allegare documento di convocazione) Con appuntamento fissato per il giorno:", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 }, spacing: { after: 100 } }),

                    // Details
                    new Paragraph({
                        children: [
                            new TextRun({ text: "presso la sede: " + (sessione.sede || data.ente.indirizzo), font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `per il giorno ${sessione.data_completa} alle ore ${sessione.ora_inizio}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })
                        ],
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [new TextRun({ text: "Con modalità appuntamento:", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({ children: [new TextRun({ text: "in presenza", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: "a distanza", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 }, spacing: { after: 100 } }),

                    new Paragraph({
                        children: [new TextRun({ text: "Per l’erogazione di:", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({ children: [new TextRun({ text: "Assessment e PSP", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: "Servizi specialistici nell’ambito di un programma di politica attiva del lavoro (specificare tipologia servizio)", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 }, spacing: { after: 300 } }),

                    // Footnote 1
                    new Paragraph({
                        children: [
                            new TextRun({ text: "1 La presente comunicazione deve essere obbligatoriamente trasmessa entro tre giorni dal verificarsi dell’evento mediante PEC.", size: 16, font: FONT_FAMILY })
                        ],
                        spacing: { after: 300 }
                    }),

                    // ESITO
                    new Paragraph({
                        children: [new TextRun({ text: "L’appuntamento ha avuto il seguente esito (barrare una delle seguenti opzioni):", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 50 },
                        pageBreakBefore: true
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: "a)\tLa persona è risultata assente e non ha prodotto documentazione attestante il giustificativo dell’assenza", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        indent: { left: 720, hanging: 360 }, // Indent for a)
                        spacing: { after: 50 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: "b)\tLa persona è risultata assente e ha prodotto documentazione attestante il giustificativo dell’assenza che alleghiamo per la necessaria validazione o diniego di vostra competenza", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        indent: { left: 720, hanging: 360 },
                        spacing: { after: 400 }
                    }),

                    // SIGNATURE
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: `Data: ${sessione.data_completa}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })],
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    }),
                                    new TableCell({
                                        children: [new Paragraph({ children: [new TextRun({ text: `Firma: ${data.responsabile_certificazione?.nome_completo || '................................'}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })], alignment: AlignmentType.RIGHT })],
                                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                    })
                                ]
                            })
                        ],
                        borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                    }),

                    new Paragraph({ text: "", spacing: { after: 300 } }),

                    // ALLEGATI
                    new Paragraph({
                        children: [new TextRun({ text: "Allegati (se presenti):", font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                        spacing: { after: 50 }
                    }),
                    new Paragraph({ children: [new TextRun({ text: "convocazione formale", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: "documentazione attestante il giustificativo dell’assenza", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 } }),
                    new Paragraph({ children: [new TextRun({ text: "nota di accompagnamento alla documentazione", font: FONT_FAMILY, size: FONT_SIZE_BODY })], bullet: { level: 0 } }),
                ]
            }]
        });

        return await Packer.toBlob(doc);
    }

    private createNoBorderRow(label: string, value: string): Paragraph {
        return new Paragraph({
            children: [
                new TextRun({ text: label, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                new TextRun({ text: "\t" + value, font: FONT_FAMILY, size: FONT_SIZE_BODY })
            ],
            tabStops: [
                { type: "left", position: 2268 } // 4cm approx (1cm = 567 twips)
            ]
        });
    }

    // --- CONVOCAZIONE BENEFICIARIO GENERATION (FILLED) ---
    public async generateConvocazione(data: CourseData, partecipante: Partecipante): Promise<Blob> {
        // Load Header Image
        let headerImageBuffer: ArrayBuffer | null = null;
        try {
            headerImageBuffer = await this.fetchImage('/Header/logo_finanziatori.png');
        } catch (e) {
            console.error("Could not load header image", e);
        }

        const sections: ISectionOptions[] = [{
            properties: {
                page: {
                    margin: {
                        top: "1.5cm",
                        bottom: "2cm",
                        left: "2cm",
                        right: "2cm"
                    }
                }
            },
            headers: {
                default: new Header({
                    children: [
                        headerImageBuffer ? new Paragraph({
                            children: [
                                new ImageRun({
                                    data: headerImageBuffer,
                                    transformation: { width: 600, height: 60 },
                                    type: "png"
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }) : new Paragraph({ text: "[HEADER LOGOS PLACEHOLDER]", alignment: AlignmentType.CENTER }),
                    ],
                }),
            },
            children: [
                // --- PAGE 1: Dati Partecipante e Informativa ---
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "CONVOCAZIONE DEL BENEFICIARIO PER L'EROGAZIONE DEI SERVIZI...",
                            bold: true,
                            size: 24, // 12pt
                            font: FONT_FAMILY,
                            allCaps: true
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),

                // Participant Data
                new Paragraph({
                    children: [
                        new TextRun({ text: "Nome: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                        new TextRun({ text: partecipante.nome || "", font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Cognome: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                        new TextRun({ text: partecipante.cognome || "", font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "CF: ", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                        new TextRun({ text: partecipante.codiceFiscale || "", font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                    ],
                    spacing: { after: 200 }
                }),

                // Body Text with Supervisor Email
                new Paragraph({
                    children: [
                        new TextRun({ text: "Si comunica che il/la sottoscritto/a sarà seguito/a dal supervisore contattabile all'indirizzo email: ", font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                        new TextRun({ text: data.supervisore.nome_completo ? `${data.supervisore.nome_completo.replace(/\s+/g, '.').toLowerCase()}@akgitalia.it` : "........................@akgitalia.it", font: FONT_FAMILY, size: FONT_SIZE_BODY, color: "0000FF", underline: {} }),
                        new TextRun({ text: ".", font: FONT_FAMILY, size: FONT_SIZE_BODY }),
                    ],
                    spacing: { after: 400 }
                }),

                // Signature Block (Page 1)
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: `${data.sede.indirizzo ? data.sede.indirizzo.split(',')[1] || 'Milano' : 'Milano'}, ${data.corso.data_inizio}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                    ],
                                    width: { size: 33, type: WidthType.PERCENTAGE },
                                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: "Firma Ente", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })] }),
                                        new Paragraph({ children: [new TextRun({ text: data.ente.nome || "AKG", font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                    ],
                                    width: { size: 33, type: WidthType.PERCENTAGE },
                                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: "Firma Beneficiario", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })] }),
                                        new Paragraph({ children: [new TextRun({ text: `${partecipante.nome} ${partecipante.cognome}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                    ],
                                    width: { size: 33, type: WidthType.PERCENTAGE },
                                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                }),
                            ]
                        })
                    ],
                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                }),

                // --- PAGE 2: Note Legali ---
                new Paragraph({
                    text: "",
                    pageBreakBefore: true
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "NOTE E SANZIONI (NASPI, DIS-COLL, RDC)", bold: true, size: 24, font: FONT_FAMILY }),
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "[INSERIRE ORA IL TESTO STATICO DELLE SANZIONI COME DA PDF ORIGINALE]",
                            font: FONT_FAMILY,
                            size: FONT_SIZE_BODY,
                            color: "FF0000"
                        })
                    ],
                    spacing: { after: 200 }
                }),

                // --- PAGE 3: Calendario ---
                new Paragraph({
                    text: "",
                    pageBreakBefore: true
                }),

                // Calendar Metadata
                new Paragraph({
                    children: [new TextRun({ text: `Nome: ${partecipante.nome} Cognome: ${partecipante.cognome} CF: ${partecipante.codiceFiscale}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Titolo Percorso: ${data.corso.titolo}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: `ID Corso: ${data.corso.id} | ID Sezione: ${data.moduli[0]?.id_sezione || 'UNICA'}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Soggetto Erogatore: ${data.ente.nome}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Sede: ${data.sede.indirizzo}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Periodo: dal ${data.corso.data_inizio} al ${data.corso.data_fine}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })],
                    spacing: { after: 200 }
                }),

                // DYNAMIC CALENDAR TABLE
                this.createConvocazioneCalendarTable(data),

                new Paragraph({ text: "", spacing: { after: 400 } }),

                // Final Signatures (Replicated)
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: `${data.sede.indirizzo ? data.sede.indirizzo.split(',')[1] || 'Milano' : 'Milano'}, ${data.corso.data_inizio}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                    ],
                                    width: { size: 33, type: WidthType.PERCENTAGE },
                                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: "Firma Ente", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })] }),
                                        new Paragraph({ children: [new TextRun({ text: data.ente.nome || "AKG", font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                    ],
                                    width: { size: 33, type: WidthType.PERCENTAGE },
                                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: "Firma Beneficiario", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })] }),
                                        new Paragraph({ children: [new TextRun({ text: `${partecipante.nome} ${partecipante.cognome}`, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })
                                    ],
                                    width: { size: 33, type: WidthType.PERCENTAGE },
                                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                                }),
                            ]
                        })
                    ],
                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } }
                }),
            ]
        }];

        const doc = new Document({ sections });

        return await Packer.toBlob(doc);
    }

    private createConvocazioneCalendarTable(data: CourseData): Table {
        // Header Row
        const headerRow = new TableRow({
            children: [
                this.createTableHeaderCell("Data"),
                this.createTableHeaderCell("Mattina"),
                this.createTableHeaderCell("Pomeriggio"),
                this.createTableHeaderCell("Tot. ore"),
                this.createTableHeaderCell("Docente"),
            ]
        });

        // Loop through all sessions
        const allSessions = data.moduli.flatMap(m => m.sessioni).sort((a, b) => a.numero - b.numero);

        const rows = allSessions.map(session => {
            // Determine Morning / Afternoon
            let morning = "";
            let afternoon = "";
            let totalHours = this.calculateDurationSimple(session.ora_inizio, session.ora_fine);

            const startH = parseInt(session.ora_inizio.split(':')[0]);
            const endH = parseInt(session.ora_fine.split(':')[0]);

            if (startH < 13) {
                // Has morning part
                if (endH <= 13 || (endH === 13 && parseInt(session.ora_fine.split(':')[1] || '0') === 0)) {
                    morning = `${session.ora_inizio} - ${session.ora_fine}`;
                } else {
                    // Spans to afternoon
                    morning = `${session.ora_inizio} - 13:00`;
                    if (endH >= 14) {
                        afternoon = `14:00 - ${session.ora_fine}`;
                    }
                }
            } else {
                // Starts after 13:00 -> Afternoon
                afternoon = `${session.ora_inizio} - ${session.ora_fine}`;
            }

            if (morning && afternoon) {
                // Subtract 1h break approx if spanning. Simple approximation.
                totalHours -= 1;
            }
            if (totalHours < 0) totalHours = 0;

            return new TableRow({
                children: [
                    this.createTableCell(session.data_completa),
                    this.createTableCell(morning || "----"),
                    this.createTableCell(afternoon || "----"),
                    this.createTableCell(totalHours.toString()),
                    this.createTableCell(data.trainer.nome_completo || "Docente AKG"),
                ]
            });
        });

        rows.push(new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Totale Ore", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })],
                    verticalAlign: AlignmentType.CENTER,
                    borders: this.getSimpleBorders(),
                    columnSpan: 3,
                    shading: { fill: GRAY_BANNER_COLOR }
                }),
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: data.corso.ore_totali || "0", bold: true, font: FONT_FAMILY, size: FONT_SIZE_BODY })] })],
                    verticalAlign: AlignmentType.CENTER,
                    borders: this.getSimpleBorders(),
                }),
                new TableCell({
                    children: [new Paragraph({ text: "" })],
                    verticalAlign: AlignmentType.CENTER,
                    borders: this.getSimpleBorders(),
                }),
            ]
        }));


        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...rows],
            borders: this.getSimpleBorders()
        });
    }

}
