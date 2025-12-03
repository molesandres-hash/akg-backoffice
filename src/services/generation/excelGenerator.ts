import * as XLSX from 'xlsx';
import type { CourseData, Sessione, Partecipante } from '@/types/extraction';

/**
 * Generates Registro Presenze Excel with formulas
 */
export function generateRegistroPresenze(data: CourseData, moduleIndex: number = 0): Blob {
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];
  const sessions = currentModule?.sessioni || [];
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.data_completa.split('/').reverse().join('-')).getTime() - 
    new Date(b.data_completa.split('/').reverse().join('-')).getTime()
  );
  
  const wb = XLSX.utils.book_new();
  
  // Header row: Nome Corsista, Date columns, Totale Ore
  const headers = ['N.', 'Cognome', 'Nome', 'Codice Fiscale'];
  sortedSessions.forEach(s => headers.push(s.data_completa));
  headers.push('Totale Ore');
  
  // Data rows with formulas
  const wsData: (string | number | { f: string })[][] = [headers];
  
  data.partecipanti.forEach((p, i) => {
    const row: (string | number | { f: string })[] = [
      i + 1,
      p.cognome || '',
      p.nome || '',
      p.codiceFiscale || ''
    ];
    
    // Empty cells for hours (columns E onwards)
    sortedSessions.forEach(() => row.push(''));
    
    // SUM formula for total hours (last column)
    const startCol = XLSX.utils.encode_col(4); // Column E
    const endCol = XLSX.utils.encode_col(4 + sortedSessions.length - 1);
    const rowNum = i + 2; // 1-indexed, +1 for header
    row.push({ f: `SUM(${startCol}${rowNum}:${endCol}${rowNum})` });
    
    wsData.push(row);
  });
  
  // Totals row
  const totalsRow: (string | number | { f: string })[] = ['', '', '', 'TOTALE'];
  sortedSessions.forEach((_, colIdx) => {
    const col = XLSX.utils.encode_col(4 + colIdx);
    totalsRow.push({ f: `SUM(${col}2:${col}${data.partecipanti.length + 1})` });
  });
  // Grand total
  const lastDataCol = XLSX.utils.encode_col(4 + sortedSessions.length);
  totalsRow.push({ f: `SUM(${lastDataCol}2:${lastDataCol}${data.partecipanti.length + 1})` });
  wsData.push(totalsRow);
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 4 },  // N.
    { wch: 20 }, // Cognome
    { wch: 15 }, // Nome
    { wch: 18 }, // CF
    ...sortedSessions.map(() => ({ wch: 12 })),
    { wch: 12 }  // Totale
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates Lista Partecipanti Excel
 */
export function generateListaPartecipanti(data: CourseData): Blob {
  const wb = XLSX.utils.book_new();
  
  const headers = ['N.', 'Cognome', 'Nome', 'Codice Fiscale', 'Email', 'Telefono'];
  const wsData = [headers];
  
  data.partecipanti.forEach((p, i) => {
    wsData.push([
      String(i + 1),
      p.cognome || '',
      p.nome || '',
      p.codiceFiscale || '',
      p.email || '',
      p.telefono || ''
    ]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws['!cols'] = [
    { wch: 4 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
    { wch: 15 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Partecipanti');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates Report Completo Excel with multiple sheets
 */
export function generateReportCompleto(data: CourseData, moduleIndex: number = 0): Blob {
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Riepilogo
  const riepilogoData = [
    ['RIEPILOGO CORSO'],
    [],
    ['ID Corso', data.corso.id],
    ['Titolo', data.corso.titolo],
    ['Data Inizio', data.corso.data_inizio],
    ['Data Fine', data.corso.data_fine],
    ['Ore Totali', data.corso.ore_totali],
    ['Tipo', data.corso.tipo],
    ['Stato', data.corso.stato],
    [],
    ['Modulo', currentModule?.titolo || ''],
    ['ID Modulo', currentModule?.id || ''],
    ['ID Sezione', currentModule?.id_sezione || ''],
    [],
    ['Ente', data.ente.nome],
    ['Sede', data.sede.nome],
    ['Indirizzo Sede', data.sede.indirizzo],
    [],
    ['Docente', data.trainer.nome_completo],
    ['CF Docente', data.trainer.codice_fiscale],
    ['Direttore', data.direttore.nome_completo],
    [],
    ['N. Partecipanti', data.partecipanti.length],
    ['N. Sessioni', currentModule?.sessioni?.length || 0],
    ['N. Moduli', data.moduli.length]
  ];
  
  const wsRiepilogo = XLSX.utils.aoa_to_sheet(riepilogoData);
  wsRiepilogo['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsRiepilogo, 'Riepilogo');
  
  // Sheet 2: Partecipanti
  const partecipantiHeaders = ['N.', 'Cognome', 'Nome', 'Codice Fiscale', 'Email', 'Telefono'];
  const partecipantiData = [partecipantiHeaders];
  data.partecipanti.forEach((p, i) => {
    partecipantiData.push([
      String(i + 1),
      p.cognome || '',
      p.nome || '',
      p.codiceFiscale || '',
      p.email || '',
      p.telefono || ''
    ]);
  });
  
  const wsPartecipanti = XLSX.utils.aoa_to_sheet(partecipantiData);
  wsPartecipanti['!cols'] = [{ wch: 4 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsPartecipanti, 'Partecipanti');
  
  // Sheet 3: Sessioni
  const sessioniHeaders = ['N.', 'Data', 'Giorno', 'Ora Inizio', 'Ora Fine', 'Durata', 'Sede', 'Modalità'];
  const sessioniData = [sessioniHeaders];
  
  const sessions = currentModule?.sessioni || [];
  sessions.forEach((s, i) => {
    sessioniData.push([
      String(i + 1),
      s.data_completa || '',
      s.giorno_settimana || '',
      s.ora_inizio || '',
      s.ora_fine || '',
      s.durata || '',
      s.sede || data.sede.nome || '',
      s.is_fad ? 'FAD' : 'Presenza'
    ]);
  });
  
  const wsSessioni = XLSX.utils.aoa_to_sheet(sessioniData);
  wsSessioni['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, 
    { wch: 10 }, { wch: 8 }, { wch: 25 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSessioni, 'Sessioni');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generates Calendario Lezioni Excel
 */
export function generateCalendarioLezioni(data: CourseData, moduleIndex: number = 0): Blob {
  const currentModule = data.moduli[moduleIndex] || data.moduli[0];
  const sessions = currentModule?.sessioni || [];
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.data_completa.split('/').reverse().join('-')).getTime() - 
    new Date(b.data_completa.split('/').reverse().join('-')).getTime()
  );
  
  const wb = XLSX.utils.book_new();
  
  const headers = ['N.', 'Data', 'Giorno', 'Ora Inizio', 'Ora Fine', 'Durata (h)', 'Modalità', 'Argomento'];
  const wsData: (string | number)[][] = [headers];
  
  sortedSessions.forEach((s, i) => {
    wsData.push([
      i + 1,
      s.data_completa || '',
      s.giorno_settimana || '',
      s.ora_inizio || '',
      s.ora_fine || '',
      s.durata || calculateDuration(s.ora_inizio, s.ora_fine),
      s.is_fad ? 'FAD/Online' : 'Presenza',
      s.argomento || ''
    ]);
  });
  
  // Totale ore
  wsData.push(['', '', '', '', 'TOTALE', { toString: () => `=SUM(F2:F${sortedSessions.length + 1})` } as any, '', '']);
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, 
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 40 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Calendario');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Clean Excel mode - forces all cells as text
 */
export function generateCleanExcel(
  headers: string[], 
  rows: string[][], 
  sheetName: string = 'Dati'
): Blob {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Force all cells as text
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].t = 's'; // Force string type
        ws[addr].z = '@'; // Text format
      }
    }
  }
  
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return '0';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const hours = Math.max(0, (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0))) / 60;
  return hours.toString();
}
