import { geminiClient, type RawExtractionResult } from './geminiClient';
import type { ExtractionResult, Modulo, Sessione } from '@/types/extraction';

export type ExtractionMode = 'standard' | 'multi-step' | 'double-check';

export interface StructuredInput {
  corso: string;
  moduli: string;
  partecipanti: string;
}

export interface ExtractionResponse {
  result: ExtractionResult;
  confidence?: 'excellent' | 'reliable' | 'review_needed';
  warnings?: string[];
  matchScore?: number;
}

// Formatta l'input strutturato per l'AI con separatori chiari
function formatInputForAI(input: StructuredInput): string {
  const parts: string[] = [];
  
  if (input.corso.trim()) {
    parts.push(`=== DATI CORSO PRINCIPALE ===
${input.corso}`);
  }
  
  if (input.moduli.trim()) {
    parts.push(`=== DATI MODULI (FONTE DI VERITÀ PER ID) ===
${input.moduli}`);
  }
  
  if (input.partecipanti.trim()) {
    parts.push(`=== ELENCO PARTECIPANTI ===
${input.partecipanti}`);
  }
  
  return parts.join('\n\n');
}

// Helper to convert raw session to typed session
function convertSession(raw: { data: string; ora_inizio: string; ora_fine: string; is_fad?: boolean; sede?: string; tipo_sede?: string }, index: number): Sessione {
  const [giorno, meseNumero, anno] = raw.data.split('/');
  const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  
  const date = new Date(parseInt(anno), parseInt(meseNumero) - 1, parseInt(giorno));
  const giornoSettimana = giorni[date.getDay()];
  const mese = mesi[parseInt(meseNumero) - 1];

  return {
    numero: index + 1,
    data_completa: raw.data,
    giorno,
    mese,
    mese_numero: meseNumero,
    anno,
    giorno_settimana: giornoSettimana,
    ora_inizio: raw.ora_inizio,
    ora_fine: raw.ora_fine,
    sede: raw.sede || '',
    tipo_sede: raw.is_fad ? 'online' : (raw.tipo_sede as 'presenza' | 'online' | 'fad' | '' || 'presenza'),
    is_fad: raw.is_fad ?? false
  };
}

// Convert raw extraction result to typed ExtractionResult
function convertToExtractionResult(raw: RawExtractionResult): ExtractionResult {
  const moduli: Modulo[] = (raw.moduli || []).map((m, idx) => ({
    titolo: m.titolo || '',
    id: m.id || `modulo_${idx + 1}`,
    id_corso: m.id_corso || '',
    id_sezione: m.id_sezione || '',
    argomenti: m.argomenti || [],
    data_inizio: m.data_inizio || '',
    data_fine: m.data_fine || '',
    ore_totali: m.ore_totali || '',
    ore_rendicontabili: m.ore_rendicontabili || '',
    tipo_sede: m.tipo_sede || 'Online',
    provider: m.provider || '',
    capienza: m.capienza || '',
    stato: m.stato || '',
    sessioni: (m.sessioni_raw || []).map((s, i) => convertSession(s, i)),
    sessioni_presenza: (m.sessioni_raw || []).filter(s => !s.is_fad).map((s, i) => convertSession(s, i))
  }));

  // Calculate dates from sessions
  moduli.forEach(m => {
    if (m.sessioni.length > 0) {
      if (!m.data_inizio) m.data_inizio = m.sessioni[0].data_completa;
      if (!m.data_fine) m.data_fine = m.sessioni[m.sessioni.length - 1].data_completa;
    }
  });

  return {
    corso: {
      titolo: raw.corso?.titolo || '',
      id: raw.corso?.id || '',
      tipo: (raw.corso?.tipo as '' | 'FAD' | 'misto' | 'presenza') || 'FAD',
      data_inizio: raw.corso?.data_inizio || moduli[0]?.data_inizio || '',
      data_fine: raw.corso?.data_fine || moduli[moduli.length - 1]?.data_fine || '',
      durata_totale: raw.corso?.durata_totale || raw.corso?.ore_totali || '',
      ore_totali: raw.corso?.ore_totali || '',
      ore_rendicontabili: raw.corso?.ore_rendicontabili || raw.corso?.ore_totali || '',
      capienza: raw.corso?.capienza || '',
      capienza_numero: parseInt(raw.corso?.capienza?.split('/')[0] || '0'),
      capienza_totale: parseInt(raw.corso?.capienza?.split('/')[1] || '0'),
      stato: raw.corso?.stato || '',
      anno: raw.corso?.anno || new Date().getFullYear().toString(),
      programma: raw.corso?.programma || '',
      offerta_formativa: { codice: raw.offerta_formativa?.codice || '', nome: raw.offerta_formativa?.nome || '' }
    },
    moduli,
    sede: {
      tipo: raw.sede?.tipo || '',
      nome: raw.sede?.nome || '',
      modalita: raw.sede?.modalita || '',
      indirizzo: raw.sede?.indirizzo || ''
    },
    ente: {
      nome: raw.ente?.nome || '',
      id: raw.ente?.id || '',
      indirizzo: raw.ente?.indirizzo || '',
      accreditato: {
        nome: raw.ente?.nome || '',
        via: '',
        numero_civico: '',
        comune: '',
        cap: '',
        provincia: ''
      }
    },
    trainer: {
      nome: raw.trainer?.nome || raw.trainer?.nome_completo?.split(' ')[0] || '',
      cognome: raw.trainer?.cognome || raw.trainer?.nome_completo?.split(' ').slice(1).join(' ') || '',
      nome_completo: raw.trainer?.nome_completo || `${raw.trainer?.nome || ''} ${raw.trainer?.cognome || ''}`.trim(),
      codice_fiscale: raw.trainer?.codice_fiscale || ''
    },
    tutor: {
      nome: raw.tutor?.nome || '',
      cognome: raw.tutor?.cognome || '',
      nome_completo: raw.tutor?.nome_completo || '',
      codice_fiscale: raw.tutor?.codice_fiscale || ''
    },
    direttore: {
      nome_completo: raw.direttore?.nome_completo || '',
      qualifica: raw.direttore?.qualifica || ''
    },
    partecipanti: (raw.partecipanti || []).map(p => ({
      nome: p.nome || '',
      cognome: p.cognome || '',
      codiceFiscale: p.codice_fiscale || '',
      email: p.email || '',
      telefono: p.telefono || p.cellulare || '',
      benefits: p.benefits === 'Sì' || p.benefits === 'Si' || p.benefits === 'sì' || p.benefits === 'si'
    })),
    fad_settings: {
      piattaforma: raw.fad_info?.piattaforma || raw.fad_settings?.piattaforma || '',
      modalita_gestione: raw.fad_info?.modalita_gestione || 'Sincrona',
      modalita_valutazione: raw.fad_info?.modalita_valutazione || '',
      obiettivi_didattici: '',
      zoom_meeting_id: raw.fad_info?.id_riunione || raw.fad_settings?.meeting_id || '',
      zoom_passcode: raw.fad_info?.passcode || raw.fad_settings?.passcode || '',
      zoom_link: raw.fad_info?.link || raw.fad_settings?.link || ''
    }
  };
}

// Merge results from multi-step extraction
function mergeResults(step1: RawExtractionResult, step2: RawExtractionResult, step3: RawExtractionResult): RawExtractionResult {
  // Merge module IDs from step2 into moduli from step1
  const moduli = (step1.moduli || []).map((m, idx) => {
    const idInfo = step2.moduli_ids?.[idx] || {};
    return {
      ...m,
      id: idInfo.id || m.id,
      id_corso: idInfo.id_corso || m.id_corso,
      id_sezione: idInfo.id_sezione || m.id_sezione
    };
  });

  return {
    corso: { ...step1.corso, ...step2.corso },
    moduli,
    partecipanti: step3.partecipanti,
    trainer: step2.trainer,
    tutor: step2.tutor,
    direttore: step2.direttore,
    ente: step2.ente,
    sede: step2.sede,
    fad_settings: step2.fad_settings,
    fad_info: step2.fad_info
  };
}

// Compare two extraction results and calculate match score
function compareResults(result1: ExtractionResult, result2: ExtractionResult): { score: number; warnings: string[] } {
  const warnings: string[] = [];
  let matches = 0;
  let total = 0;

  // Compare corso fields
  const corsoFields = ['id', 'titolo', 'tipo', 'data_inizio', 'data_fine', 'ore_totali'] as const;
  for (const field of corsoFields) {
    total++;
    if (result1.corso[field] === result2.corso[field]) {
      matches++;
    } else if (result1.corso[field] && result2.corso[field]) {
      warnings.push(`Campo corso.${field} differisce: "${result1.corso[field]}" vs "${result2.corso[field]}"`);
    }
  }

  // Compare module IDs
  const minModules = Math.min(result1.moduli.length, result2.moduli.length);
  for (let i = 0; i < minModules; i++) {
    total += 2;
    if (result1.moduli[i].id_corso === result2.moduli[i].id_corso) matches++;
    else warnings.push(`ID Corso modulo ${i + 1} differisce`);
    
    if (result1.moduli[i].id_sezione === result2.moduli[i].id_sezione) matches++;
    else warnings.push(`ID Sezione modulo ${i + 1} differisce`);
  }

  // Compare participant count
  total++;
  if (result1.partecipanti.length === result2.partecipanti.length) {
    matches++;
  } else {
    warnings.push(`Numero partecipanti differisce: ${result1.partecipanti.length} vs ${result2.partecipanti.length}`);
  }

  // Compare participant CFs
  const cfs1 = new Set(result1.partecipanti.map(p => p.codiceFiscale));
  const cfs2 = new Set(result2.partecipanti.map(p => p.codiceFiscale));
  for (const cf of cfs1) {
    total++;
    if (cfs2.has(cf)) matches++;
    else warnings.push(`Codice fiscale ${cf} presente solo in una estrazione`);
  }

  return { score: total > 0 ? matches / total : 1, warnings };
}

export class ExtractionService {
  /**
   * Main extraction method - routes to appropriate strategy based on mode
   * Accepts structured input with 3 separate blocks
   */
  async extract(input: StructuredInput | string, mode: ExtractionMode): Promise<ExtractionResponse> {
    if (!geminiClient.hasApiKey()) {
      throw new Error('Gemini API Key non configurata. Vai nelle Impostazioni per inserirla.');
    }

    // Convert string input to structured if needed (backward compatibility)
    const structuredInput: StructuredInput = typeof input === 'string' 
      ? { corso: input, moduli: '', partecipanti: '' }
      : input;

    // Format input for AI
    const formattedInput = formatInputForAI(structuredInput);

    switch (mode) {
      case 'standard':
        return this.extractStandard(formattedInput);
      case 'multi-step':
        return this.extractMultiStep(formattedInput);
      case 'double-check':
        return this.extractDoubleCheck(formattedInput);
      default:
        return this.extractStandard(formattedInput);
    }
  }

  /**
   * Standard extraction - single API call
   */
  private async extractStandard(input: string): Promise<ExtractionResponse> {
    const raw = await geminiClient.extractStandard(input);
    return { result: convertToExtractionResult(raw) };
  }

  /**
   * Multi-step extraction - 3 sequential calls for maximum precision
   */
  private async extractMultiStep(input: string): Promise<ExtractionResponse> {
    // Step 1: Calendar and structure
    const step1 = await geminiClient.extractStep1(input);
    
    // Step 2: IDs and metadata
    const step2 = await geminiClient.extractStep2(input);
    
    // Step 3: Participants
    const step3 = await geminiClient.extractStep3(input);
    
    // Merge all results
    const merged = mergeResults(step1, step2, step3);
    
    return { result: convertToExtractionResult(merged) };
  }

  /**
   * Double-check extraction - 2 parallel calls with comparison
   */
  private async extractDoubleCheck(input: string): Promise<ExtractionResponse> {
    // Run two extractions in parallel
    const [raw1, raw2] = await Promise.all([
      geminiClient.extractStandard(input),
      geminiClient.extractStandard(input)
    ]);

    const result1 = convertToExtractionResult(raw1);
    const result2 = convertToExtractionResult(raw2);

    // Compare results
    const { score, warnings } = compareResults(result1, result2);

    // Determine confidence level
    let confidence: 'excellent' | 'reliable' | 'review_needed';
    if (score >= 0.95) {
      confidence = 'excellent';
    } else if (score >= 0.80) {
      confidence = 'reliable';
    } else {
      confidence = 'review_needed';
    }

    return {
      result: result1, // Use first result as primary
      confidence,
      warnings: warnings.length > 0 ? warnings : undefined,
      matchScore: Math.round(score * 100)
    };
  }
}

// Singleton instance
export const extractionService = new ExtractionService();
