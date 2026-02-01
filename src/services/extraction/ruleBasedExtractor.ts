import { ExtractionResult, Modulo, Sessione, Partecipante } from '@/types/extraction';
import { StructuredInput } from './extractionService';

export class RuleBasedExtractor {

    parse(input: StructuredInput): ExtractionResult {
        // 1. Parse Moduli (Box 2) first, as it's the source of truth for IDs
        const moduli = this.parseModuliBox(input.moduli);

        // 2. Parse Dettagli Base (Box 1) for Sessions and general info
        const { generale, sessioniMap } = this.parseDettagliBox(input.corso);

        // 3. Parse Partecipanti (Box 3)
        const partecipanti = this.parsePartecipantiBox(input.partecipanti);

        // 4. Merge and Refine
        moduli.forEach((m, index) => {
            // Filter sessions for this module
            const modTitle = m.titolo.toLowerCase();

            const moduleSessions = sessioniMap.filter(s => {
                const sessRef = s.refName.toLowerCase();
                const explicitMatch = sessRef.includes(`modulo ${index + 1}`) || sessRef.includes(`(${index + 1})`);
                return explicitMatch || sessRef.includes(modTitle) || modTitle.includes(sessRef);
            });

            if (moduleSessions.length > 0) {
                m.sessioni = moduleSessions.map(s => s.sessione);
                // Renumber sessions locally for the module
                m.sessioni.forEach((sess, idx) => sess.numero = idx + 1);

                m.data_inizio = m.sessioni[0].data_completa;
                m.data_fine = m.sessioni[m.sessioni.length - 1].data_completa;

                // Determine type based on sessions
                const anyOnline = m.sessioni.some(s => s.tipo_sede === 'online');
                const allOnline = m.sessioni.every(s => s.tipo_sede === 'online');

                if (allOnline) {
                    m.tipo_sede = 'Online';
                } else if (anyOnline) {
                    m.tipo_sede = 'Misto';
                } else {
                    m.tipo_sede = 'Presenza';
                }
            }
        });

        // General Course Type logic
        const isFad = moduli.some(m => m.tipo_sede === 'Online' || m.tipo_sede === 'Misto');

        return {
            corso: {
                ...generale,
                id: generale.id,
                tipo: isFad ? 'FAD' : 'Presenza',
                capienza: generale.capienza || moduli[0]?.capienza || '',
                ore_totali: generale.ore_totali || moduli.reduce((acc, m) => acc + parseInt(m.ore_totali || '0'), 0).toString(),
                data_inizio: moduli[0]?.data_inizio || generale.data_inizio,
                data_fine: moduli[moduli.length - 1]?.data_fine || generale.data_fine
            },
            moduli,
            partecipanti,
            sede: {
                nome: generale.ufficio,
                tipo: isFad ? 'Online' : 'Ufficio',
                modalita: '',
                indirizzo: ''
            },
            ente: {
                nome: moduli[0]?.provider || '',
                id: '',
                indirizzo: ''
            },
            trainer: {
                nome_completo: generale.trainer,
                nome: generale.trainer.split(' ')[0] || '',
                cognome: generale.trainer.split(' ').slice(1).join(' ') || '',
                codice_fiscale: ''
            },
            tutor: { nome: '', cognome: '', nome_completo: '', codice_fiscale: '' },
            direttore: { nome_completo: '', qualifica: '' },
            fad_settings: {
                piattaforma: 'Zoom',
                modalita_gestione: 'Sincrona',
                modalita_valutazione: '',
                obiettivi_didattici: '',
                zoom_meeting_id: '',
                zoom_passcode: '',
                zoom_link: ''
            }
        };
    }

    // --- Box 1 Parsing (Dettagli di Base) ---
    private parseDettagliBox(text: string): { generale: any, sessioniMap: { refName: string, sessione: Sessione }[] } {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const result: any = {};
        const sessioni: { refName: string, sessione: Sessione }[] = [];

        let currentSection = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (['ID', 'Corso', 'Quando', 'Ufficio', 'Capienza', 'Trainer', 'Tipo di sede', 'Ore Totali', 'Durata', 'Rendicontabile', 'Stato'].includes(line)) {
                currentSection = line;
                continue;
            }

            if (currentSection === 'Quando') {
                const dateRegex = /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})(?:\s+-\s+(.*))?$/;
                const match = line.match(dateRegex);

                if (match) {
                    const [_, dateStr, start, end, typeRaw] = match;
                    const preDatePart = line.substring(0, match.index).trim();
                    let refName = preDatePart.replace(/ - $/, '');

                    let tipoSede: 'presenza' | 'online' = 'presenza';
                    let isFad = false;

                    let locType = (typeRaw || '').toLowerCase();
                    if (locType.includes('online') || locType.includes('fad') || locType.includes('webinar')) {
                        tipoSede = 'online';
                        isFad = true;
                    }

                    const [day, month, year] = dateStr.split('/');
                    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
                    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

                    sessioni.push({
                        refName,
                        sessione: {
                            numero: 0,
                            data_completa: dateStr,
                            giorno: day,
                            mese: months[parseInt(month) - 1],
                            mese_numero: month,
                            anno: year,
                            giorno_settimana: days[d.getDay()],
                            ora_inizio: start,
                            ora_fine: end,
                            sede: locType,
                            tipo_sede: tipoSede,
                            is_fad: isFad
                        }
                    });
                }
                continue;
            }

            if (currentSection === 'ID') result.id = line;
            if (currentSection === 'Corso') result.titolo = line;
            if (currentSection === 'Ufficio') result.ufficio = line;
            if (currentSection === 'Trainer') result.trainer = line;
            if (currentSection === 'Ore Totali') result.ore_totali = line;
            if (currentSection === 'Rendicontabile') result.ore_rendicontabili = line;
            if (currentSection === 'Stato') result.stato = line;
            if (currentSection === 'Capienza') result.capienza = line;
        }

        return { generale: result, sessioniMap: sessioni };
    }

    // --- Box 2 Parsing (Moduli) ---
    private parseModuliBox(text: string): Modulo[] {
        const modules: Modulo[] = [];
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        let isHeaderFound = false;
        let currentRow: Partial<Modulo> | null = null;

        // Regex for ID columns: 5 digits <tab/space> 6 digits
        const idsRegex = /(\d{5})\s+(\d{6})/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('ID Corso') && line.includes('ID Sezione')) {
                isHeaderFound = true;
                continue;
            }
            if (!isHeaderFound) continue;
            if (line.includes('righe visualizzata')) break;

            const idMatch = line.match(idsRegex);

            if (idMatch) {
                if (currentRow) {
                    modules.push(currentRow as Modulo);
                }

                const [_, idCorso, idSezione] = idMatch;
                const parts = line.split('\t');
                const title = parts[0].trim();

                currentRow = {
                    titolo: title,
                    id: `mod_${modules.length + 1}`,
                    id_corso: idCorso,
                    id_sezione: idSezione,
                    argomenti: [],
                    sessioni: [],
                    sessioni_presenza: [],
                    provider: '',
                    tipo_sede: 'Presenza',
                    stato: '',
                    capienza: '',
                    ore_rendicontabili: '',
                    ore_totali: ''
                };

                if (this.hasFooterInfo(parts)) {
                    this.extractFooterInfo(parts, currentRow);
                }
                continue;
            }

            if (currentRow) {
                const parts = line.split('\t');
                if (this.hasFooterInfo(parts)) {
                    this.extractFooterInfo(parts, currentRow);
                }
            }
        }

        if (currentRow) modules.push(currentRow as Modulo);

        return modules as Modulo[];
    }

    private hasFooterInfo(parts: string[]): boolean {
        if (parts.length === 0) return false;
        const last = parts[parts.length - 1].trim();
        return ['Aperto', 'Chiuso', 'InCorso'].includes(last) || (/\d+\/\d+/.test(last) && parts.length > 3);
    }

    private extractFooterInfo(parts: string[], module: any) {
        const n = parts.length;
        if (n < 8) return;

        module.stato = parts[n - 1];
        module.capienza = parts[n - 2];
        module.ore_rendicontabili = parts[n - 3];
        module.ore_totali = parts[n - 5];
        module.tipo_sede = parts[n - 7];
        module.provider = parts[n - 8];
    }

    // --- Box 3 Parsing (Partecipanti) ---
    private parsePartecipantiBox(text: string): Partecipante[] {
        const lines = text.split('\n');
        const participants: Partecipante[] = [];

        let headerFound = false;

        for (const line of lines) {
            if (line.includes('Codice Fiscale') && line.includes('Nome')) {
                headerFound = true;
                continue;
            }
            if (!headerFound) continue;
            if (line.trim() === '' || line.includes('righe visualizzata')) continue;

            const parts = line.split('\t');
            if (parts.length < 5) continue;

            participants.push({
                nome: parts[2].split(' ')[0],
                cognome: parts[2].split(' ').slice(1).join(' '),
                codiceFiscale: parts[1],
                email: parts[5],
                telefono: parts[4] || parts[3],
                benefits: (parts[9] || '').toLowerCase().includes('s'), // "Sì" or "Si"
            });
        }

        return participants;
    }
}
