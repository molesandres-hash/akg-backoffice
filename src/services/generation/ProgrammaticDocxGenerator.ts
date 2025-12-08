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
    NumberFormat
} from "docx";
import { CourseData, Sessione, Partecipante } from "@/types/extraction";

// --- Constants & Styles ---
const FONT_FAMILY = "Calibri";
const FONT_SIZE_TITLE = 28; // 14pt
const FONT_SIZE_HEADING = 24; // 12pt
const FONT_SIZE_BODY = 22; // 11pt
const FONT_SIZE_SMALL = 18; // 9pt
const GRAY_BANNER_COLOR = "D9D9D9"; // Light gray
const YELLOW_HIGHLIGHT_COLOR = "FFFF00"; // Yellow for mandatory fields


// Helper to create a standard document with header/footer
export class ProgrammaticDocxGenerator {

    // --- HELPERS ---
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
    public async generateModelloB(data: CourseData, sessionIndex: number): Promise<Blob> {
        // Find session
        const currentModule = data.moduli.find(m => m.sessioni.some((s: any) => s.is_fad)) || data.moduli[0];
        // Note: sessionIndex passed here is likely index within the Filtered FAD sessions, NOT global index.
        // We need to match it correctly.
        // Assuming the caller passes the correct session object would be safer, but let's find it.
        const fadSessions = currentModule.sessioni.filter((s: any) => s.is_fad);
        const session = fadSessions[sessionIndex];

        if (!session) {
            throw new Error(`Session Modello B not found for index ${sessionIndex}`);
        }

        // 1. Fetch Header Image
        let headerImageBuffer: ArrayBuffer | null = null;
        try {
            headerImageBuffer = await this.fetchImage('/Templates_standard/86e2d75c-adbe-4e9d-8afa-25b423f5e444.png');
        } catch (e) {
            console.error("Could not load header image", e);
        }

        const doc = new Document({
            sections: [{
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
                                        size: 14, // Smaller text like 7pt
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
                            })
                        ]
                    })
                },
                children: [
                    // --- Title Section ---
                    new Paragraph({
                        children: [
                            new TextRun({ text: "MODELLO B) (1)", bold: true, size: FONT_SIZE_TITLE, font: FONT_FAMILY })
                        ],
                        spacing: { after: 100 }
                    }),

                    // Boxed Title: REGISTRO FORMATIVO ...
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

                    // --- Main Table with Date Header & Participants ---
                    this.createModelloBTable(data, session),

                    new Paragraph({ text: "", spacing: { after: 400 } }),

                    // --- Signatures ---
                    this.createSignatureSection(data),

                ]
            }]
        });

        return await Packer.toBlob(doc);
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
            this.createDataRow("Numero di ore in FAD...", (data.fad_settings.obiettivi_didattici || data.corso.ore_totali).toString(), true), // Yellow
            this.createDataRow("Offerta Formativa in Gefo o SIUF......", `${data.corso.offerta_formativa.codice} ${data.corso.offerta_formativa.nome}`, true), // Yellow
            this.createDataRow("Referente delle attività", data.trainer.nome_completo),
            this.createDataRow("E-mail e n. telefono:", `${data.trainer.telefono || '.............'} ${data.trainer.email || '...........'} @akgitalia.it`),
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
                .map((session) => {
                    return new TableRow({
                        children: [
                            this.createTableCell(session.data_completa),
                            this.createTableCell(session.ora_inizio),
                            this.createTableCell(session.ora_fine),
                            this.createTableCell(session.argomento || modulo.titolo),
                            this.createTableCell(data.trainer.nome_completo || ''),
                            this.createTableCell(""),
                        ]
                    })
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

    private createModelloBTable(data: CourseData, session: Sessione): Table {
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
        const rows = data.partecipanti.map(p => {
            return new TableRow({
                children: [
                    this.createTableCell(`${p.cognome} ${p.nome}`),
                    this.createTableCell(session.ora_inizio), // Placeholder logic: usually connection time = start time
                    this.createTableCell(session.ora_fine),   // Placeholder logic: disconnection = end time
                    this.createTableCell(`${session.ora_inizio} - ${session.ora_fine}`), // Time range
                    this.createTableCell(session.argomento || ""),
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

    private createSignatureSection(data: CourseData): Table {
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
    };
}
