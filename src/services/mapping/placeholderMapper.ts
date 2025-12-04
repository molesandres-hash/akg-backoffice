import type { CourseData, PlaceholderMap } from '@/types/extraction';

export function mapCourseDataToPlaceholders(data: CourseData, moduleIndex: number = 0): PlaceholderMap {
  const today = new Date();
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];
  const allSessions = data.moduli.flatMap(m => m.sessioni);
  const fadSessions = allSessions.filter(s => s.is_fad);
  const presenzaSessions = allSessions.filter(s => !s.is_fad);
  const totalFadHours = fadSessions.reduce((acc, s) => acc + calculateDurationWithLunchBreak(s.ora_inizio, s.ora_fine), 0);
  const totalPresenzaHours = presenzaSessions.reduce((acc, s) => acc + calculateDurationWithLunchBreak(s.ora_inizio, s.ora_fine), 0);
  const totalHoursCalculated = totalFadHours + totalPresenzaHours;
  const sedeAccreditataCompleta = [data.ente.accreditato.nome, [data.ente.accreditato.via, data.ente.accreditato.numero_civico].filter(Boolean).join(' '), data.ente.accreditato.comune].filter(Boolean).join(' - ');
  const verbaleLuogo = data.ente.accreditato.comune || data.sede.nome?.split(' ')[0] || '';
  
  // Calculated fields
  const numeroPagine = presenzaSessions.length;
  const dataVidimazione = presenzaSessions.length > 0 ? presenzaSessions[presenzaSessions.length - 1].data_completa : '';

  return {
    NOME_CORSO: data.corso.titolo || '', CORSO_TITOLO: data.corso.titolo || '', ID_CORSO: currentModule?.id_corso || data.corso.id || '', ID_SEZIONE: currentModule?.id_sezione || '',
    DATA_INIZIO: data.corso.data_inizio || currentModule?.data_inizio || '', DATA_FINE: data.corso.data_fine || currentModule?.data_fine || '', ORE_TOTALI: data.corso.ore_totali || '',
    ORE_RENDICONTABILI: data.corso.ore_rendicontabili || '', ANNO_CORSO: data.corso.anno || new Date().getFullYear().toString(), TIPO_CORSO: data.corso.tipo || '', CAPIENZA: data.corso.capienza || '', STATO: data.corso.stato || '',
    CODICE_OFFERTA_FORMATIVA: data.corso.offerta_formativa?.codice || '', NOME_OFFERTA_FORMATIVA: data.corso.offerta_formativa?.nome || '',
    ENTE_NOME: data.ente.nome || '', ENTE_INDIRIZZO: data.ente.indirizzo || '', SEDE_ACCREDITATA: data.ente.accreditato.nome || '', SEDE_ACCREDITATA_COMPLETA: sedeAccreditataCompleta,
    SEDE_NOME: data.sede.nome || '', SEDE_INDIRIZZO: data.sede.indirizzo || '', SEDE_TIPO: data.sede.tipo || '', VERBALE_LUOGO: verbaleLuogo,
    NOME_DOCENTE: data.trainer.nome_completo || [data.trainer.nome, data.trainer.cognome].filter(Boolean).join(' '), DOCENTE_NOME: data.trainer.nome || '', DOCENTE_COGNOME: data.trainer.cognome || '',
    DOCENTE_COMPLETO: data.trainer.nome_completo || [data.trainer.nome, data.trainer.cognome].filter(Boolean).join(' '), CODICE_FISCALE_DOCENTE: data.trainer.codice_fiscale || '', EMAIL_DOCENTE: data.trainer.email || '', TELEFONO_DOCENTE: data.trainer.telefono || '',
    TUTOR_NOME: data.tutor.nome || '', TUTOR_COGNOME: data.tutor.cognome || '', TUTOR_COMPLETO: data.tutor.nome_completo || [data.tutor.nome, data.tutor.cognome].filter(Boolean).join(' '), TUTOR_CORSO: data.tutor.nome_completo || '',
    DIRETTORE_CORSO: data.direttore.nome_completo || '', DIRETTORE_NOME_COMPLETO: data.direttore.nome_completo || '', DIRETTORE_QUALIFICA: data.direttore.qualifica || '',
    SUPERVISORE_NOME_COMPLETO: data.supervisore?.nome_completo || '', SUPERVISORE_QUALIFICA: data.supervisore?.qualifica || '',
    RESP_CERT_NOME_COMPLETO: data.responsabile_certificazione?.nome_completo || '', RESP_CERT_QUALIFICA: data.responsabile_certificazione?.qualifica || '',
    RESP_CERT_DATA_NASCITA: data.responsabile_certificazione?.data_nascita || '', RESP_CERT_LUOGO_NASCITA: data.responsabile_certificazione?.luogo_nascita || '',
    RESP_CERT_RESIDENZA: data.responsabile_certificazione?.residenza || '', RESP_CERT_DOCUMENTO: data.responsabile_certificazione?.documento || '',
    PIATTAFORMA: data.fad_settings.piattaforma || '', MODALITA_GESTIONE: data.fad_settings.modalita_gestione || '', MODALITA_VALUTAZIONE: data.fad_settings.modalita_valutazione || '',
    OBIETTIVI_DIDATTICI: data.fad_settings.obiettivi_didattici || '', ZOOM_MEETING_ID: data.fad_settings.zoom_meeting_id || '', ZOOM_PASSCODE: data.fad_settings.zoom_passcode || '',
    ZOOM_LINK: data.fad_settings.zoom_link || '', ID_RIUNIONE: data.fad_settings.zoom_meeting_id || '', PASSCODE: data.fad_settings.zoom_passcode || '', 
    ORE_FAD: totalFadHours.toString(), ORE_TOTALE_FAD: totalFadHours.toString(),
    ORE_PRESENZA: totalPresenzaHours.toString(), ORE_TOTALE_PRESENZA: totalPresenzaHours.toString(),
    ORE_TOTALI_CALCOLATE: totalHoursCalculated.toString(),
    NUMERO_PAGINE: numeroPagine.toString(), DATA_VIDIMAZIONE: dataVidimazione,
    MODULO_TITOLO: currentModule?.titolo || data.corso.titolo || '', MODULO_ID: currentModule?.id || '', MODULO_ID_SEZIONE: currentModule?.id_sezione || '', MODULO_NUMERO: moduleIndex + 1,
    MODULO_DATA_INIZIO: currentModule?.data_inizio || '', MODULO_DATA_FINE: currentModule?.data_fine || '', MODULO_ORE: currentModule?.ore_totali || '', MODULO_TIPO_SEDE: currentModule?.tipo_sede || '',
    DATA_OGGI: formatItalianDate(today), GIORNO: today.getDate().toString().padStart(2, '0'), MESE: getItalianMonth(today.getMonth()), ANNO: today.getFullYear().toString(),
    STUDENTI: data.partecipanti.map((p, i) => ({ INDEX: i + 1, NUMERO: i + 1, NOME: p.nome || '', COGNOME: p.cognome || '', NOME_COMPLETO: [p.nome, p.cognome].filter(Boolean).join(' '), CF: p.codiceFiscale || '', CODICE_FISCALE: p.codiceFiscale || '', EMAIL: p.email || '', TELEFONO: p.telefono || '' })),
    PARTECIPANTI: data.partecipanti.map((p, i) => ({ numero: i + 1, nome: p.nome || '', cognome: p.cognome || '', nome_completo: [p.nome, p.cognome].filter(Boolean).join(' '), codice_fiscale: p.codiceFiscale || '', email: p.email || '', telefono: p.telefono || '' })),
    SESSIONI: allSessions.map((s, i) => ({ numero: s.numero || i + 1, data: s.data_completa || '', giorno: s.giorno || '', mese: s.mese || '', anno: s.anno || '', ora_inizio: s.ora_inizio || '', ora_fine: s.ora_fine || '', durata: s.durata || calculateDuration(s.ora_inizio, s.ora_fine).toString(), argomento: s.argomento || '', sede: s.sede || data.sede.nome || '', modalita: s.is_fad ? 'FAD' : (s.tipo_sede || 'Presenza') })),
    SESSIONI_FAD: fadSessions.map((s, i) => ({ numero: s.numero || i + 1, data: s.data_completa || '', giorno: s.giorno || '', mese: s.mese || '', anno: s.anno || '', ora_inizio: s.ora_inizio || '', ora_fine: s.ora_fine || '', durata: s.durata || calculateDuration(s.ora_inizio, s.ora_fine).toString(), PARTECIPANTI_SESSIONE: data.partecipanti.map((p, j) => ({ numero: j + 1, nome: p.nome || '', cognome: p.cognome || '', nome_completo: [p.nome, p.cognome].filter(Boolean).join(' '), codice_fiscale: p.codiceFiscale || '', ora_connessione: s.ora_inizio || '', ora_disconnessione: s.ora_fine || '' })) })),
    SESSIONI_PRESENZA: presenzaSessions.map((s, i) => ({ numero: s.numero || i + 1, data: s.data_completa || '', giorno: s.giorno || '', mese: s.mese || '', anno: s.anno || '', ora_inizio: s.ora_inizio || '', ora_fine: s.ora_fine || '', durata: s.durata || calculateDuration(s.ora_inizio, s.ora_fine).toString(), sede: s.sede || data.sede.indirizzo || '' })),
    MODULI: data.moduli.map((m, i) => ({ INDEX: i + 1, NUMERO: i + 1, TITOLO: m.titolo || '', ID: m.id || '', ID_SEZIONE: m.id_sezione || '', DATA_INIZIO: m.data_inizio || '', DATA_FINE: m.data_fine || '', ORE: m.ore_totali || '', TIPO_SEDE: m.tipo_sede || '' })),
    LISTA_ARGOMENTI: data.moduli.flatMap(m => m.argomenti.map(arg => ({ argomento: arg, modulo: m.titolo, ARGOMENTO: arg, MODULO: m.titolo }))),
    // Placeholder numerati per partecipanti (basati sull'ordine dell'array)
    ...generateNumberedParticipantPlaceholders(data.partecipanti),
  };
}

/**
 * Genera placeholder numerati per ogni partecipante basandosi sull'ordine dell'array
 * L'indice 0 dell'array corrisponde a PARTECIPANTE_1, indice 1 a PARTECIPANTE_2, etc.
 * Questo ordine riflette il drag & drop nell'interfaccia utente
 */
function generateNumberedParticipantPlaceholders(partecipanti: CourseData['partecipanti']): Record<string, string> {
  const placeholders: Record<string, string> = {};
  
  partecipanti.forEach((p, index) => {
    const num = index + 1; // Indice 0 → Partecipante 1
    const nomeCompleto = [p.nome, p.cognome].filter(Boolean).join(' ');
    
    placeholders[`PARTECIPANTE_${num}`] = nomeCompleto;
    placeholders[`PARTECIPANTE_${num}_NOME`] = p.nome || '';
    placeholders[`PARTECIPANTE_${num}_COGNOME`] = p.cognome || '';
    placeholders[`PARTECIPANTE_${num}_COMPLETO`] = nomeCompleto;
    placeholders[`PARTECIPANTE_${num}_CF`] = p.codiceFiscale || '';
    placeholders[`PARTECIPANTE_${num}_CODICE_FISCALE`] = p.codiceFiscale || '';
    placeholders[`PARTECIPANTE_${num}_EMAIL`] = p.email || '';
    placeholders[`PARTECIPANTE_${num}_TELEFONO`] = p.telefono || '';
  });
  
  return placeholders;
}

function formatItalianDate(date: Date): string { return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`; }
function getItalianMonth(m: number): string { return ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'][m] || ''; }
// Costanti pausa pranzo
const LUNCH_BREAK_START = 13;
const LUNCH_BREAK_END = 14;

/**
 * Calcola la durata in ore escludendo la pausa pranzo 13:00-14:00
 */
export function calculateDurationWithLunchBreak(start: string, end: string): number {
  if (!start || !end) return 0;
  
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  
  const startMinutes = sh * 60 + (sm || 0);
  const endMinutes = eh * 60 + (em || 0);
  
  let totalMinutes = endMinutes - startMinutes;
  
  // Verifica sovrapposizione con pausa pranzo (13:00-14:00)
  const lunchStartMinutes = LUNCH_BREAK_START * 60;
  const lunchEndMinutes = LUNCH_BREAK_END * 60;
  
  if (startMinutes < lunchEndMinutes && endMinutes > lunchStartMinutes) {
    const overlapStart = Math.max(startMinutes, lunchStartMinutes);
    const overlapEnd = Math.min(endMinutes, lunchEndMinutes);
    const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
    totalMinutes -= overlapMinutes;
  }
  
  return Math.max(0, Math.round(totalMinutes / 60));
}

// Alias per retrocompatibilità
function calculateDuration(start: string, end: string): number {
  return calculateDurationWithLunchBreak(start, end);
}
export function validatePlaceholders(map: PlaceholderMap): string[] { const w: string[] = []; if (!map.CORSO_TITOLO) w.push('Titolo corso mancante'); if (!map.ENTE_NOME) w.push('Nome ente mancante'); if (map.STUDENTI.length === 0) w.push('Nessun partecipante'); if (map.SESSIONI.length === 0) w.push('Nessuna sessione'); return w; }
