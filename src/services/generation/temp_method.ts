    // --- CONVOCAZIONE BENEFICIARIO GENERATION (FILLED) ---
    public async generateConvocazione(data: CourseData, partecipante: Partecipante): Promise < Blob > {
    // Load Header Image
    let headerImageBuffer: ArrayBuffer | null = null;
    try {
        headerImageBuffer = await this.fetchImage('/Header/logo_finanziatori.png');
    } catch(e) {
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
