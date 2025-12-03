import type { CourseData, PlaceholderMap } from '@/types/extraction';

/**
 * Converts CourseData to a flat PlaceholderMap for docxtemplater
 * All keys are UPPERCASE for consistency with Word templates
 */
export function mapCourseDataToPlaceholders(data: CourseData): PlaceholderMap {
  const today = new Date();
  const formatDate = (dateStr: string) => dateStr || '';
  
  // Find first and last session dates
  const sortedSessions = [...data.sessioni].sort((a, b) => {
    const dateA = parseItalianDate(a.data);
    const dateB = parseItalianDate(b.data);
    return dateA.getTime() - dateB.getTime();
  });
  
  const dataInizio = sortedSessions[0]?.data || '';
  const dataFine = sortedSessions[sortedSessions.length - 1]?.data || '';
  
  return {
    // Globali
    CORSO_TITOLO: data.titoloCorso || '',
    CORSO_ID: data.idCorso || '',
    SEZIONE_ID: data.idSezione || '',
    ENTE_NOME: data.ente || '',
    ORE_TOTALI: data.oreTotali || 0,
    SEDE: data.sede || '',
    
    // Persone
    DOCENTE_NOME: data.docenteNome || '',
    DOCENTE_COGNOME: data.docenteCognome || '',
    DOCENTE_COMPLETO: joinNames(data.docenteNome, data.docenteCognome),
    TUTOR_NOME: data.tutorNome || '',
    TUTOR_COGNOME: data.tutorCognome || '',
    TUTOR_COMPLETO: joinNames(data.tutorNome, data.tutorCognome),
    
    // Date
    DATA_OGGI: formatItalianDate(today),
    DATA_INIZIO: dataInizio,
    DATA_FINE: dataFine,
    
    // Loop: Studenti
    STUDENTI: data.partecipanti.map((p, index) => ({
      INDEX: index + 1,
      NOME: p.nome || '',
      COGNOME: p.cognome || '',
      NOME_COMPLETO: joinNames(p.nome, p.cognome),
      CF: p.codiceFiscale || '',
      EMAIL: p.email || '',
      TELEFONO: p.telefono || '',
    })),
    
    // Loop: Lezioni
    LEZIONI: data.sessioni.map((s, index) => ({
      INDEX: index + 1,
      DATA: formatDate(s.data),
      ORA_INIZIO: s.oraInizio || '',
      ORA_FINE: s.oraFine || '',
      ARGOMENTO: s.argomento || '',
      SEDE: s.sede || data.sede || '',
    })),
    
    // Loop: Moduli
    MODULI: data.moduli.map((m, index) => ({
      INDEX: index + 1,
      TITOLO: m.titolo || '',
      DATA_INIZIO: formatDate(m.dataInizio),
      DATA_FINE: formatDate(m.dataFine),
      ORE: m.oreTotali || 0,
      TIPO_SEDE: translateTipoSede(m.tipoSede),
    })),
  };
}

// Helper functions
function joinNames(nome: string, cognome: string): string {
  return [nome, cognome].filter(Boolean).join(' ');
}

function formatItalianDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseItalianDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function translateTipoSede(tipo: string): string {
  const translations: Record<string, string> = {
    'presenza': 'In Presenza',
    'online': 'Online',
    'fad': 'FAD',
    'misto': 'Misto',
  };
  return translations[tipo] || tipo;
}

/**
 * Validates that required placeholders are filled
 */
export function validatePlaceholders(map: PlaceholderMap): string[] {
  const warnings: string[] = [];
  
  if (!map.CORSO_TITOLO) warnings.push('Titolo corso mancante');
  if (!map.ENTE_NOME) warnings.push('Nome ente mancante');
  if (map.STUDENTI.length === 0) warnings.push('Nessun partecipante inserito');
  if (map.LEZIONI.length === 0) warnings.push('Nessuna lezione inserita');
  
  return warnings;
}
